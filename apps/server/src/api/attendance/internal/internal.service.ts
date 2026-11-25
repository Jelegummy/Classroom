import { Context, requireStaff } from '@app/common'
import { PrismaService } from '@app/db'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { CreateGameAttendanceDto } from './internal.dto'

@Injectable()
export class AttendanceInternalService {
  constructor(private readonly db: PrismaService) {}

  async createGameAttendance(args: CreateGameAttendanceDto, ctx: Context) {
    // Awards points, so it must not be callable by students (previously any
    // authenticated user could grant arbitrary points to anyone).
    const staff = requireStaff(ctx, 'record attendance')
    const targetUserId = args.userId

    return this.db.$transaction(async tx => {
      const classroomGame = await tx.classroomOnGame.findUnique({
        where: {
          classroomId_gameId: {
            classroomId: args.classroomId,
            gameId: args.activeGameId,
          },
        },
        include: { classroom: { select: { schoolId: true } } },
      })
      if (!classroomGame) {
        throw new NotFoundException('Game session not found in this classroom')
      }
      if (
        staff.role !== 'ADMIN' &&
        classroomGame.classroom.schoolId !== staff.schoolId
      ) {
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
        select: { userId: true },
      })
      if (!classroomUser) {
        throw new BadRequestException('User is not enrolled in this classroom')
      }

      const newAttendance = await tx.attendance.create({
        data: {
          userId: targetUserId,
          activeGameId: classroomGame.id,
          status: args.status,
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
        data: { score: { increment: args.scoreEarned } },
      })

      await tx.user.update({
        where: { id: targetUserId },
        data: { points: { increment: args.scoreEarned } },
      })

      return newAttendance
    })
  }
}
