import {
  Context,
  ContextUser,
  assertOwnerOrAdmin,
  getUserFromContext,
  requireStaff,
} from '@app/common'
import { PrismaService, TransactionClient } from '@app/db'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { AttackGameArgs, CreateGameArgs, UpdateGameArgs } from './internal.dto'

type UserRef = Pick<ContextUser, 'id' | 'role' | 'schoolId'>

const gameDetailsInclude = {
  creator: { select: { firstName: true, lastName: true } },
  items: { include: { item: true } },
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
    where: { isActive: true },
    include: {
      attendances: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              points: true,
              inventory: { include: { item: true } },
            },
          },
        },
      },
    },
  },
} as const

@Injectable()
export class GameInternalService {
  constructor(private readonly db: PrismaService) {}

  /** A classroom game the user can play: same school, or enrolled in the classroom. */
  private findPlayableGame(user: UserRef, gameId: string) {
    return this.db.classroomOnGame.findFirst({
      where: {
        gameId,
        classroom: {
          OR: [
            { schoolId: user.schoolId },
            { users: { some: { userId: user.id } } },
          ],
        },
      },
      include: {
        game: {
          include: {
            character: { select: { maxHp: true, pointBoss: true } },
          },
        },
      },
    })
  }

  private async getOwnedGame(user: UserRef, gameId: string) {
    const game = await this.db.game.findUnique({
      where: { id: gameId },
      select: { id: true, creatorId: true },
    })
    if (!game) {
      throw new NotFoundException('Game not found')
    }
    assertOwnerOrAdmin(
      user,
      game.creatorId,
      'You are not the owner of this game',
    )

    return game
  }

  async createGameSession(args: CreateGameArgs, ctx: Context) {
    const user = requireStaff(ctx, 'create game sessions')

    const membership = await this.db.classroomOnUser.findUnique({
      where: {
        userId_classroomId: { userId: user.id, classroomId: args.classroomId },
      },
      select: { userId: true },
    })
    if (!membership && user.role !== 'ADMIN') {
      throw new NotFoundException('Classroom not found or access denied')
    }

    return this.db.$transaction(async tx => {
      const gameSession = await tx.game.create({
        data: {
          name: args.name,
          imageUrl: args.imageUrl,
          description: args.description,
          isActive: true,
          timeLimit: args.timeLimit ?? 0,
          damageBoost: args.damageBoost ?? 0,
          maxHpBoss: args.maxHpBoss ?? 0,
          character: { connect: { id: args.characterId } },
          creator: { connect: { id: user.id } },
        },
      })

      await tx.classroomOnGame.create({
        data: {
          classroomId: args.classroomId,
          gameId: gameSession.id,
          currentHp: args.maxHpBoss ?? 0,
        },
      })

      return gameSession
    })
  }

  async updateGameSession(args: UpdateGameArgs, ctx: Context) {
    const user = requireStaff(ctx, 'update game sessions')
    await this.getOwnedGame(user, args.id)

    return this.db.game.update({
      where: { id: args.id },
      data: {
        name: args.name,
        imageUrl: args.imageUrl,
        description: args.description,
        isActive: args.isActive,
      },
    })
  }

  async getAllGameSessions(ctx: Context) {
    const user = getUserFromContext(ctx)

    // `schoolId` is now populated by the auth middleware; previously it was
    // undefined, so this filter was ignored and games of every school leaked.
    return this.db.game.findMany({
      where: { creator: { schoolId: user.schoolId } },
      include: gameDetailsInclude,
      orderBy: { createdAt: 'desc' },
    })
  }

  async getGameSession(args: { id: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    const gameSession = await this.db.game.findFirst({
      where: { id: args.id, creator: { schoolId: user.schoolId } },
      include: gameDetailsInclude,
    })
    if (!gameSession) {
      throw new NotFoundException('Game session not found')
    }

    return gameSession
  }

  async deleteGameSession(args: { id: string }, ctx: Context) {
    const user = requireStaff(ctx, 'delete game sessions')
    await this.getOwnedGame(user, args.id)

    await this.db.$transaction([
      this.db.attendance.deleteMany({
        where: { activeGame: { gameId: args.id } },
      }),
      this.db.gameOnItem.deleteMany({ where: { gameId: args.id } }),
      this.db.classroomOnGame.deleteMany({ where: { gameId: args.id } }),
      this.db.game.delete({ where: { id: args.id } }),
    ])
  }

  async addItemToGame(
    ctx: Context,
    gameIds: { gameId: string },
    itemIds: { itemId: string },
  ) {
    const user = requireStaff(ctx, 'add items to game sessions')
    await this.getOwnedGame(user, gameIds.gameId)

    return this.db.gameOnItem.upsert({
      where: {
        gameId_itemId: { gameId: gameIds.gameId, itemId: itemIds.itemId },
      },
      update: {},
      create: { gameId: gameIds.gameId, itemId: itemIds.itemId },
    })
  }

  /** Locks the classroom-game row so concurrent attacks are serialized. */
  private async lockCurrentHp(tx: TransactionClient, activeGameId: string) {
    const rows = await tx.$queryRaw<{ current_hp: number }[]>`
      SELECT current_hp FROM classroom_games WHERE id = ${activeGameId} FOR UPDATE
    `
    if (rows.length === 0) {
      throw new NotFoundException('Active game session not found')
    }

    return rows[0].current_hp
  }

  private async distributePoints(
    tx: TransactionClient,
    activeGameId: string,
    classroomId: string,
    bossMaxHp: number,
    bossPoints: number,
  ) {
    if (bossPoints <= 0) {
      return
    }

    const attackers = await tx.attendance.findMany({
      where: { activeGameId, scoreEarned: { lte: 0 }, damageDealt: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    })

    let remainingPoints = bossPoints
    const writes: Promise<unknown>[] = []

    for (const attacker of attackers) {
      if (remainingPoints <= 0) {
        break
      }

      const finalScore = Math.min(
        Math.floor((attacker.damageDealt / bossMaxHp) * bossPoints),
        remainingPoints,
      )
      if (finalScore <= 0) {
        continue
      }
      remainingPoints -= finalScore

      writes.push(
        tx.user.update({
          where: { id: attacker.userId },
          data: { points: { increment: finalScore } },
        }),
        tx.classroomOnUser.updateMany({
          where: { userId: attacker.userId, classroomId },
          data: { score: { increment: finalScore } },
        }),
        tx.attendance.update({
          where: { id: attacker.id },
          data: { scoreEarned: finalScore },
        }),
      )
    }

    await Promise.all(writes)
  }

  async attackBoss(ctx: Context, args: AttackGameArgs) {
    const user = getUserFromContext(ctx)

    const activeGame = await this.findPlayableGame(user, args.gameId)
    if (!activeGame) {
      throw new NotFoundException('Active game session not found')
    }

    return this.db.$transaction(async tx => {
      // Re-read HP under a row lock: the previous read-modify-write let parallel
      // attacks overwrite each other and could distribute points twice.
      const currentHp = await this.lockCurrentHp(tx, activeGame.id)
      if (currentHp <= 0) {
        throw new BadRequestException('Boss is already dead')
      }

      const actualDamage = Math.min(args.damage, currentHp)
      const newHp = currentHp - actualDamage

      await tx.attendance.upsert({
        where: {
          userId_activeGameId: { userId: user.id, activeGameId: activeGame.id },
        },
        update: { damageDealt: { increment: actualDamage } },
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
        await this.distributePoints(
          tx,
          activeGame.id,
          activeGame.classroomId,
          activeGame.game.maxHpBoss || 1,
          activeGame.game.character?.pointBoss ?? 0,
        )
      }

      return {
        currentHp: newHp,
        damageDealt: actualDamage,
        isDead: newHp === 0,
      }
    })
  }

  async getGameLeaderboard(ctx: Context, args: { id: string }) {
    const user = getUserFromContext(ctx)

    const activeGame = await this.db.classroomOnGame.findFirst({
      where: {
        gameId: args.id,
        classroom: {
          OR: [
            { schoolId: user.schoolId },
            { users: { some: { userId: user.id } } },
          ],
        },
      },
      include: { game: { include: { character: true } } },
    })
    if (!activeGame) {
      return []
    }

    const leaderboard = await this.db.attendance.findMany({
      where: { activeGameId: activeGame.id, damageDealt: { gt: 0 } },
      select: {
        id: true,
        damageDealt: true,
        scoreEarned: true,
        user: {
          select: { id: true, firstName: true, lastName: true, points: true },
        },
      },
      orderBy: { damageDealt: 'desc' },
    })

    return {
      character: activeGame.game.character,
      leaderboard,
      games: activeGame.game,
    }
  }

  async joinGame(ctx: Context, args: { gameId: string }) {
    const user = getUserFromContext(ctx)

    const activeGame = await this.findPlayableGame(user, args.gameId)
    if (!activeGame) {
      throw new NotFoundException('Active game session not found')
    }

    await this.db.attendance.upsert({
      where: {
        userId_activeGameId: { userId: user.id, activeGameId: activeGame.id },
      },
      update: { status: 'PRESENT' },
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
    await this.getOwnedGame(user, args.gameId)

    await this.db.game.update({
      where: { id: args.gameId },
      data: { status: 'ONGOING', startedAt: new Date() },
    })
  }

  async endGame(ctx: Context, args: { gameId: string }) {
    const user = getUserFromContext(ctx)
    // Previously any authenticated user could end any game.
    await this.getOwnedGame(user, args.gameId)

    await this.db.game.update({
      where: { id: args.gameId },
      data: { status: 'FINISHED', isActive: false },
    })
  }

  async timeoutBossGame(ctx: Context, args: { gameId: string }) {
    const user = getUserFromContext(ctx)

    const activeGame = await this.findPlayableGame(user, args.gameId)
    if (!activeGame) {
      throw new NotFoundException('Active game session not found')
    }

    return this.db.$transaction(async tx => {
      const currentHp = await this.lockCurrentHp(tx, activeGame.id)
      if (currentHp <= 0) {
        return {
          success: true,
          message: 'Boss is already dead. Points were already distributed.',
        }
      }

      await this.distributePoints(
        tx,
        activeGame.id,
        activeGame.classroomId,
        activeGame.game.maxHpBoss || 1,
        activeGame.game.character?.pointBoss ?? 0,
      )
      await tx.classroomOnGame.update({
        where: { id: activeGame.id },
        data: { currentHp: 0 },
      })

      return { success: true }
    })
  }
}
