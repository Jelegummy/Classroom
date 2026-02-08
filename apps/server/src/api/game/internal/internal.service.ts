import { PrismaService } from '@app/db'
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateGameArgs, UpdateGameArgs } from './internal.dto'
import { Context, getUserFromContext } from '@app/common'

@Injectable()
export class GameInternalService {
  constructor(private readonly db: PrismaService) { }

  async createGameSession(args: CreateGameArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new Error('Only teachers and admins can create game sessions')
    }

    const gameSession = await this.db.game.create({
      data: {
        name: args.name,
        bossName: args.bossName,
        imageUrl: args.imageUrl,
        maxHp: args.maxHp,
        timeLimit: args.timeLimit,
        description: args.description,
        isActive: true,
        creator: {
          connect: { id: user.id },
        },
      },
    })

    await this.db.classroomOnGame.create({
      data: {
        classroom: { connect: { id: args.classroomId } },
        game: { connect: { id: gameSession.id } },
        currentHp: args.maxHp,
      }
    })

    return gameSession
  }

  async updateGameSession(args: UpdateGameArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new Error('Only teachers and admins can update game sessions')
    }

    const gameSession = await this.db.game.update({
      where: { id: args.id },
      data: {
        name: args.name,
        bossName: args.bossName,
        imageUrl: args.imageUrl,
        maxHp: args.maxHp,
        timeLimit: args.timeLimit,
        description: args.description,
        isActive: args.isActive,
      },
    })

    return gameSession
  }

  async getAllGameSessions(ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    const gameSessions = await this.db.game.findMany({
      where: {
        creator: {
          schoolId: user.schoolId,
        },
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            item: true,
          },
        },
      },
    })

    return gameSessions
  }

  async getGameSession(args: { id: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    const gameSession = await this.db.game.findUnique({
      where: {
        id: args.id,
        creator: {
          schoolId: user.schoolId,
        },
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            item: true,
          },
        },
      },
    })

    if (!gameSession) {
      throw new Error('Game session not found')
    }

    return gameSession
  }

  async deleteGameSession(args: { id: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new Error('Only teachers and admins can delete game sessions')
    }

    await this.db.game.delete({
      where: { id: args.id },
    })
  } //TODO: fix bug internal server error when deleting game session

  async addItemToGame(
    ctx: Context,
    gameIds: { gameId: string },
    itemIds: { itemId: string },
  ) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new Error('Only teachers and admins can add items to game sessions')
    }

    const game = await this.db.game.findUnique({
      where: { id: gameIds.gameId },
    })

    if (!game) {
      throw new NotFoundException('Game not found')
    }

    if (user.role !== 'ADMIN' && game.creatorId !== user.id) {
      throw new ForbiddenException('You are not the owner of this game')
    }

    const gameItem = await this.db.gameOnItem.create({
      data: {
        gameId: gameIds.gameId,
        itemId: itemIds.itemId,
      },
    })

    return gameItem
  }

  // async updateItemFromGame(ctx: Context, gameIds: { gameId: string }, itemIds: { itemId: string }) {
  //     const user = getUserFromContext(ctx);

  //     if (!user) {
  //         throw new Error('User not found');
  //     }

  //     if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
  //         throw new Error('Only teachers and admins can remove items from game sessions');
  //     }

  //     const game = await this.db.game.findUnique({
  //         where: { id: gameIds.gameId }
  //     });

  //     if (!game) {
  //         throw new NotFoundException('Game not found');
  //     }

  //     if (user.role !== 'ADMIN' && game.creatorId !== user.id) {
  //         throw new ForbiddenException('You are not the owner of this game');
  //     }

  //     const gameItem = await this.db.gameOnItem.upsert({
  //         where: {
  //             gameId_itemId: {
  //                 gameId: gameIds.gameId,
  //                 itemId: itemIds.itemId,
  //             }
  //         },
  //         update: {
  //             updatedAt: new Date(),
  //         },
  //         create: {
  //             gameId: gameIds.gameId,
  //             itemId: itemIds.itemId,
  //         }
  //     });

  //     return gameItem;
  // }
}
