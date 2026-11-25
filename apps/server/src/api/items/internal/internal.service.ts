import { Context, getUserFromContext, isStaff, requireStaff } from '@app/common'
import { PrismaService } from '@app/db'
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  BuyItemsArgs,
  ItemsArgs,
  SpacialItemsArgs,
  UpdateItemsArgs,
} from './internal.dto'

const DEFAULT_ITEM_IMAGE = 'https://placehold.co/150x150?text=Item'

@Injectable()
export class ItemsInternalService {
  constructor(private readonly db: PrismaService) {}

  async createItems(args: ItemsArgs, ctx: Context) {
    requireStaff(ctx, 'create items')

    return this.db.item.create({
      data: {
        name: args.name,
        description: args.description,
        price: args.price,
        effectValue: args.effectValue ?? 0,
        type: args.type,
        imageUrl: args.imageUrl || DEFAULT_ITEM_IMAGE,
      },
    })
  }

  async updateItems(args: UpdateItemsArgs, ctx: Context) {
    requireStaff(ctx, 'update items')

    return this.db.item.update({
      where: { id: args.id },
      data: {
        name: args.name,
        description: args.description,
        price: args.price,
        effectValue: args.effectValue ?? 0,
        type: args.type,
      },
    })
  }

  async deleteItems(args: { id: string }, ctx: Context) {
    requireStaff(ctx, 'delete items')

    await this.db.item.delete({ where: { id: args.id } })
  }

  async getItems(args: { id: string }, ctx: Context) {
    getUserFromContext(ctx)

    const item = await this.db.item.findUnique({ where: { id: args.id } })
    if (!item) {
      throw new NotFoundException('Item not found')
    }

    return item
  }

  async getAllItems(ctx: Context) {
    getUserFromContext(ctx)

    return this.db.item.findMany({ orderBy: { price: 'asc' } })
  }

  async createSpacialItems(
    args: SpacialItemsArgs,
    ctx: Context,
    userId: string,
    itemId: string,
  ) {
    requireStaff(ctx, 'grant special items')

    return this.db.userItem.upsert({
      where: { user_item_unique: { userId, itemId } },
      update: { amount: { increment: args.amount } },
      create: { userId, itemId, amount: args.amount },
    })
  }

  async buyItems(args: BuyItemsArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    // Students can only spend their own points.
    const buyerId = args.userId
    if (buyerId !== user.id && !isStaff(user)) {
      throw new ForbiddenException('You can only buy items for yourself')
    }

    const item = await this.db.item.findUnique({
      where: { id: args.itemId },
      select: { price: true },
    })
    if (!item) {
      throw new NotFoundException('Item not found')
    }

    const totalPrice = item.price * args.amount

    return this.db.$transaction(async tx => {
      // Conditional decrement: atomic balance check, no lost updates under
      // concurrent purchases (the previous read-then-write could overspend).
      const { count } = await tx.user.updateMany({
        where: { id: buyerId, points: { gte: totalPrice } },
        data: { points: { decrement: totalPrice } },
      })
      if (count === 0) {
        throw new BadRequestException('Not enough points to buy this item')
      }

      return tx.userItem.upsert({
        where: { user_item_unique: { userId: buyerId, itemId: args.itemId } },
        update: { amount: { increment: args.amount } },
        create: { userId: buyerId, itemId: args.itemId, amount: args.amount },
      })
    })
  }
}
