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
        maxHp: args.maxHp,
        timeLimit: args.timeLimit,
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
}
