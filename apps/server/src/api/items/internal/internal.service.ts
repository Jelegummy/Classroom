import { PrismaService } from '@app/db'
import { Injectable } from '@nestjs/common'
import {
  BuyItemsArgs,
  ItemsArgs,
  SpacialItemsArgs,
  UpdateItemsArgs,
} from './internal.dto'
import { Context, getUserFromContext } from '@app/common'

@Injectable()
export class ItemsInternalService {
  constructor(private readonly db: PrismaService) {}

  async createItems(args: ItemsArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new Error('Only teachers and admins can create items')
    }

    const item = await this.db.item.create({
      data: {
        name: args.name,
        description: args.description,
        price: args.price,
        effectValue: args.effectValue ?? 0,
        type: args.type,
      },
    })

    return item
  }

  async updateItems(args: UpdateItemsArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new Error('Only teachers and admins can update items')
    }

    const item = await this.db.item.update({
      where: { id: args.id },
      data: {
        name: args.name,
        description: args.description,
        price: args.price,
        effectValue: args.effectValue ?? 0,
        type: args.type,
      },
    })

    return item
  }

  async deleteItems(args: { id: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new Error('Only teachers and admins can delete items')
    }

    await this.db.item.delete({
      where: { id: args.id },
    })
  }

  async getItems(args: { id: string }, ctx: Context) {
    const user = getUserFromContext(ctx)
    if (!user) throw new Error('User not found')

    const item = await this.db.item.findUnique({
      where: { id: args.id },
    })

    if (!item) {
      throw new Error('Item not found')
    }

    return item
  }

  async getAllItems(ctx: Context) {
    const user = getUserFromContext(ctx)
    if (!user) throw new Error('User not found')

    const items = await this.db.item.findMany()

    return items
  }

  async createSpacialItems(
    args: SpacialItemsArgs,
    ctx: Context,
    userId: string,
    itemId: string,
  ) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new Error('Only teachers and admins can create spacial items')
    }

    return await this.db.userItem.upsert({
      where: {
        user_item_unique: {
          userId,
          itemId,
        },
      },
      update: {
        amount: {
          increment: args.amount,
        },
      },
      create: {
        userId: userId,
        itemId: itemId,
        amount: args.amount,
      },
    })
  }

  async buyItems(args: BuyItemsArgs, ctx: Context) {
    const userContext = getUserFromContext(ctx)
    if (!userContext) throw new Error('User not found')

    const item = await this.db.item.findUnique({ where: { id: args.itemId } })
    if (!item) throw new Error('Item not found')

    const totalPrice = item.price * args.amount

    return await this.db.$transaction(async tx => {
      // 1. ตรวจสอบ User และ Points ภายใน Transaction
      const user = await tx.user.findUnique({
        where: { id: args.userId },
        select: { points: true },
      })

      if (!user || user.points < totalPrice) {
        throw new Error('Not enough points to buy this item')
      }

      // 2. หัก Points
      await tx.user.update({
        where: { id: args.userId },
        data: { points: { decrement: totalPrice } },
      })

      // 3. เพิ่ม Item เข้า Inventory
      return await tx.userItem.upsert({
        where: {
          user_item_unique: { userId: args.userId, itemId: args.itemId },
        },
        update: { amount: { increment: args.amount } },
        create: {
          userId: args.userId,
          itemId: args.itemId,
          amount: args.amount,
        },
      })
    })
  }
}
