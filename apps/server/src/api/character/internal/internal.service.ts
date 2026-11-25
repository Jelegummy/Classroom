import {
  Context,
  assertOwnerOrAdmin,
  getUserFromContext,
  requireStaff,
} from '@app/common'
import { PrismaService } from '@app/db'
import { Injectable, NotFoundException } from '@nestjs/common'

import { CreateCharacterDto } from './internal.dto'

// Previously `creator: true`, which exposed the creator's password hash.
const creatorSelect = {
  select: { id: true, firstName: true, lastName: true, role: true },
} as const

@Injectable()
export class CharacterInternalService {
  constructor(private readonly db: PrismaService) {}

  async createCharacter(args: CreateCharacterDto, ctx: Context) {
    const user = requireStaff(ctx, 'create characters')

    return this.db.character.create({
      data: {
        bossName: args.bossName,
        pointBoss: args.pointBoss ?? 0,
        maxHp: args.maxHp ?? 0,
        timeLimit: args.timeLimit ?? 0,
        description: args.description,
        modelUrl: args.modelUrl,
        imageUrl: args.imageUrl,
        creator: { connect: { id: user.id } },
      },
    })
  }

  async getAllCharacters(ctx: Context) {
    getUserFromContext(ctx)

    return this.db.character.findMany({
      include: { creator: creatorSelect },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getCharacter(ctx: Context, args: { id: string }) {
    const user = getUserFromContext(ctx)

    const character = await this.db.character.findFirst({
      where: {
        id: args.id,
        ...(user.role === 'ADMIN' ? {} : { creatorId: user.id }),
      },
      include: { creator: creatorSelect },
    })
    if (!character) {
      throw new NotFoundException('Character not found')
    }

    return character
  }

  async deleteCharacter(ctx: Context, args: { id: string }) {
    const user = requireStaff(ctx, 'delete characters')

    const character = await this.db.character.findUnique({
      where: { id: args.id },
      select: { creatorId: true },
    })
    if (!character) {
      throw new NotFoundException('Character not found')
    }
    assertOwnerOrAdmin(user, character.creatorId)

    // A character still used by a game yields a 400 (FK) via the exception filter.
    await this.db.character.delete({ where: { id: args.id } })
  }
}
