import { PrismaService } from '@app/db'
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { CreateGameAttendanceDto } from './internal.dto'
import { Context, getUserFromContext } from '@app/common'
import { CheckStatus } from '@app/db/dist/generated/enums'

@Injectable()
export class AttendanceInternalService {
  constructor(private readonly db: PrismaService) {}

  async createGameAttendance(args: CreateGameAttendanceDto, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    const targetUserId = args.userId

    return await this.db.$transaction(async tx => {
      const classroomGame = await tx.classroomOnGame.findUnique({
        where: {
          classroomId_gameId: {
            classroomId: args.classroomId,
            gameId: args.activeGameId,
          },
        },
      })

      if (!classroomGame) {
        throw new NotFoundException('Game session not found in this classroom')
      }

      const existingAttendance = await tx.attendance.findUnique({
        where: {
          userId_activeGameId: {
            userId: targetUserId,
            activeGameId: classroomGame.id,
          },
        },
      })

      if (existingAttendance) {
        return existingAttendance
      }

      const classroomUser = await tx.classroomOnUser.findUnique({
        where: {
          userId_classroomId: {
            userId: targetUserId,
            classroomId: args.classroomId,
          },
        },
      })

      if (!classroomUser) {
        throw new BadRequestException('User is not enrolled in this classroom')
      }

      const newAttendance = await tx.attendance.create({
        data: {
          userId: targetUserId,
          activeGameId: classroomGame.id,
          status: args.status as CheckStatus,
          scoreEarned: args.scoreEarned,
        },
      })

      await tx.classroomOnUser.update({
        where: {
          userId_classroomId: {
            userId: targetUserId,
            classroomId: args.classroomId,
          },
        },
        data: {
          score: { increment: args.scoreEarned },
        },
      })

      await tx.user.update({
        where: { id: targetUserId },
        data: {
          points: { increment: args.scoreEarned },
        },
      })

      return newAttendance
    })
  }
}
