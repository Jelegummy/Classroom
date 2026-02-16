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
        imageUrl: args.imageUrl,
        description: args.description,
        isActive: true,
        timeLimit: args.timeLimit ?? 0,
        damageBoost: args.damageBoost ?? 0,
        character: {
          connect: { id: args.characterId },
        },
        creator: {
          connect: { id: user.id },
        },
      },
    })

    const character = await this.db.character.findUnique({
      where: { id: args.characterId },
    })

    await this.db.classroomOnGame.create({
      data: {
        classroom: { connect: { id: args.classroomId } },
        game: { connect: { id: gameSession.id } },
        currentHp: character?.maxHp ?? 0,
      },
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
        imageUrl: args.imageUrl,
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
        character: {
          select: {
            imageUrl: true,
            modelUrl: true,
            bossName: true,
            maxHp: true,
            timeLimit: true,
          },
        },
        classrooms: {
          where: {
            isActive: true,
          },
          include: {
            attendances: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    points: true,
                    inventory: {
                      include: {
                        item: true,
                      },
                    },
                  },
                },
              },
            },
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
        character: {
          select: {
            imageUrl: true,
            modelUrl: true,
            bossName: true,
            maxHp: true,
            timeLimit: true,
          },
        },
        classrooms: {
          where: {
            isActive: true,
          },
          include: {
            attendances: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    points: true,
                    inventory: {
                      include: {
                        item: true,
                      },
                    },
                  },
                },
              },
            },
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

    await this.db.gameOnItem.deleteMany({
      where: { gameId: args.id },
    })

    await this.db.classroomOnGame.deleteMany({
      where: { gameId: args.id },
    })

    await this.db.game.delete({
      where: { id: args.id },
    })
  }

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

  async attackBoss(ctx: Context, args: { gameId: string; damage: number }) {
    const user = getUserFromContext(ctx)
    if (!user) throw new Error('User not found')

    const activeGame = await this.db.classroomOnGame.findFirst({
      where: {
        gameId: args.gameId,
        classroom: {
          OR: [
            { school: { users: { some: { id: user.id } } } },
            { users: { some: { userId: user.id } } },
          ],
        },
      },
      include: {
        game: {
          include: {
            character: {
              select: {
                maxHp: true,
                pointBoss: true,
              },
            },
          },
        },
        classroom: true,
      },
    })

    if (!activeGame) {
      throw new NotFoundException('Active game session not found')
    }
    if (activeGame.currentHp <= 0) {
      throw new Error('Boss is already dead')
    }

    const actualDamage = Math.min(args.damage, activeGame.currentHp)
    const newHp = activeGame.currentHp - actualDamage

    await this.db.$transaction(async tx => {
      await tx.attendance.upsert({
        where: {
          userId_activeGameId: {
            userId: user.id,
            activeGameId: activeGame.id,
          },
        },
        update: {
          damageDealt: { increment: actualDamage },
          status: 'PRESENT',
        },
        create: {
          userId: user.id,
          activeGameId: activeGame.id,
          damageDealt: actualDamage,
          status: 'PRESENT',
        },
      })

      await tx.classroomOnGame.update({
        where: { id: activeGame.id },
        data: { currentHp: newHp },
      })

      if (newHp === 0) {
        const bossMaxHp = activeGame.game.character?.maxHp || 1
        const bossPoints = activeGame.game.character?.pointBoss || 0

        if (bossPoints > 0) {
          const allAttackers = await tx.attendance.findMany({
            where: { activeGameId: activeGame.id },
          })

          for (const attacker of allAttackers) {
            const rawScore = (attacker.damageDealt / bossMaxHp) * bossPoints
            const finalScore = Math.floor(rawScore)

            if (finalScore > 0) {
              await tx.user.update({
                where: { id: attacker.userId },
                data: { points: { increment: finalScore } },
              })

              await tx.classroomOnUser.updateMany({
                where: {
                  userId: attacker.userId,
                  classroomId: activeGame.classroomId,
                },
                data: { score: { increment: finalScore } },
              })

              await tx.attendance.update({
                where: { id: attacker.id },
                data: { scoreEarned: finalScore },
              })
            }
          }
        }
      }
    })

    return {
      currentHp: newHp,
      damageDealt: actualDamage,
      isDead: newHp === 0,
    }
  }

  async getGameLeaderboard(ctx: Context, args: { id: string }) {
    const user = getUserFromContext(ctx)
    if (!user) throw new Error('User not found')

    const activeGame = await this.db.classroomOnGame.findFirst({
      where: {
        gameId: args.id,
        classroom: {
          OR: [
            { school: { users: { some: { id: user.id } } } },
            { users: { some: { userId: user.id } } },
          ],
        },
      },
    })

    if (!activeGame) {
      return []
    }

    const leaderboard = await this.db.attendance.findMany({
      where: {
        activeGameId: activeGame.id,
        damageDealt: { gt: 0 },
      },
      select: {
        id: true,
        damageDealt: true,
        scoreEarned: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            points: true,
          },
        },
      },
      orderBy: {
        damageDealt: 'desc',
      },
    })

    return leaderboard
  }

  async joinGame(ctx: Context, args: { gameId: string }) {
    const user = getUserFromContext(ctx)
    if (!user) throw new Error('User not found')

    const activeGame = await this.db.classroomOnGame.findFirst({
      where: {
        gameId: args.gameId,
        classroom: {
          OR: [
            { school: { users: { some: { id: user.id } } } },
            { users: { some: { userId: user.id } } },
          ],
        },
      },
    })

    if (!activeGame) {
      throw new NotFoundException('Active game session not found')
    }

    await this.db.attendance.upsert({
      where: {
        userId_activeGameId: {
          userId: user.id,
          activeGameId: activeGame.id,
        },
      },
      update: {
        status: 'PRESENT',
      },
      create: {
        userId: user.id,
        activeGameId: activeGame.id,
        damageDealt: 0,
        status: 'PRESENT',
      },
    })
  }

  async startGame(ctx: Context, args: { gameId: string }) {
    const user = getUserFromContext(ctx)
    if (!user) throw new Error('User not found')

    const game = await this.db.game.findUnique({
      where: { id: args.gameId },
    })

    if (!game) {
      throw new NotFoundException('Game not found')
    }

    if (user.role !== 'ADMIN' && game.creatorId !== user.id) {
      throw new ForbiddenException('You are not the owner of this game')
    }

    await this.db.game.update({
      where: { id: args.gameId },
      data: { status: 'ONGOING' },
    })
  }

  async endGame(ctx: Context, args: { gameId: string }) {
    const user = getUserFromContext(ctx)
    if (!user) {
      throw new Error('User not found')
    }

    const game = await this.db.game.findUnique({
      where: { id: args.gameId },
    })

    if (!game) {
      throw new NotFoundException('Game not found')
    }

    await this.db.game.update({
      where: { id: args.gameId },
      data: {
        status: 'FINISHED',
        isActive: false,
      },
    })
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
