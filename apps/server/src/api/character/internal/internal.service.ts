import { PrismaService } from '@app/db'
import { Injectable } from '@nestjs/common'
import { CreateCharacterDto } from './internal.dto'
import { Context, getUserFromContext } from '@app/common/dist/utils'

@Injectable()
export class CharacterInternalService {
  constructor(private readonly db: PrismaService) {}

  async createCharacter(args: CreateCharacterDto, ctx: Context) {
    const user = getUserFromContext(ctx)
    if (!user) {
      throw new Error('User not found')
    }

    const character = await this.db.character.create({
      data: {
        bossName: args.bossName,
        pointBoss: args.pointBoss || 0,
        maxHp: args.maxHp || 0,
        timeLimit: args.timeLimit || 0,
        description: args.description,
        modelUrl: args.modelUrl,
        imageUrl: args.imageUrl,
        creator: {
          connect: { id: user.id },
        },
      },
    })

    return character
  }

  async getAllCharacters(ctx: Context) {
    const user = getUserFromContext(ctx)
    if (!user) {
      throw new Error('User not found')
    }

    const characters = await this.db.character.findMany({
      include: {
        creator: true,
      },
    })
    return characters
  }

  async getCharacter(ctx: Context, args: { id: string }) {
    const user = getUserFromContext(ctx)
    if (!user) {
      throw new Error('User not found')
    }

    const character = await this.db.character.findFirst({
      where: {
        id: args.id,
        creatorId: user.id,
      },
      include: {
        creator: true,
      },
    })

    if (!character) {
      throw new Error('Character not found')
    }

    return character
  }

  async deleteCharacter(ctx: Context, args: { id: string }) {
    const user = getUserFromContext(ctx)
    if (!user) {
      throw new Error('User not found')
    }

    const character = await this.db.character.findFirst({
      where: {
        id: args.id,
      },
    })

    if (!character) {
      throw new Error('Character not found')
    }

    await this.db.character.delete({
      where: {
        id: args.id,
      },
    })
  }
}
