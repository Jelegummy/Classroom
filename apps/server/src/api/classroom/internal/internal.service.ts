import {
  Context,
  getUserFromContext,
  publicUserSelect,
  requireStaff,
} from '@app/common'
import { PrismaService } from '@app/db'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { customAlphabet } from 'nanoid'

import {
  CreateClassroomArgs,
  JoinCodeArgs,
  UpdateClassroomArgs,
} from './internal.dto'

const generateCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)
const MAX_CODE_ATTEMPTS = 10
const JOIN_REWARD_FOR_TEACHER = 10

const memberUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
  points: true,
} as const

@Injectable()
export class ClassroomInternalService {
  constructor(private readonly db: PrismaService) {}

  /** Ensures the user belongs to the classroom (admins bypass the check). */
  private async assertMember(
    user: { id: string; role: string },
    classroomId: string,
  ) {
    if (user.role === 'ADMIN') {
      return
    }

    const membership = await this.db.classroomOnUser.findUnique({
      where: { userId_classroomId: { userId: user.id, classroomId } },
      select: { userId: true },
    })
    if (!membership) {
      throw new NotFoundException('Classroom not found or access denied')
    }
  }

  private async generateUniqueCode() {
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateCode()
      const existing = await this.db.classroom.findUnique({
        where: { code },
        select: { id: true },
      })
      if (!existing) {
        return code
      }
    }

    throw new ConflictException('Could not generate a unique classroom code')
  }

  async createClassroom(args: CreateClassroomArgs, ctx: Context) {
    const user = requireStaff(ctx, 'create classrooms')
    const code = await this.generateUniqueCode()

    return this.db.classroom.create({
      data: {
        name: args.name,
        code,
        title: args.title,
        school: { connect: { id: user.schoolId } },
        users: { create: { user: { connect: { id: user.id } } } },
      },
      include: { users: true },
    })
  }

  async updateClassroom(args: UpdateClassroomArgs, ctx: Context) {
    const user = requireStaff(ctx, 'update classrooms')
    await this.assertMember(user, args.id)

    await this.db.classroom.update({
      where: { id: args.id },
      data: {
        name: args.name,
        title: args.title,
        hoverImage: args.hoverImage,
      },
    })
  }

  async deleteClassroom(args: { id: string }, ctx: Context) {
    const user = requireStaff(ctx, 'delete classrooms')
    await this.assertMember(user, args.id)

    // Join tables referencing the classroom cascade; attendances that point at
    // the cascaded classroom games/tutors must be removed first.
    await this.db.$transaction(async tx => {
      await tx.attendance.deleteMany({
        where: {
          OR: [
            { activeGame: { classroomId: args.id } },
            { activeTutor: { classroomId: args.id } },
          ],
        },
      })
      await tx.classroom.delete({ where: { id: args.id } })
    })
  }

  async getClassroom(args: { id: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    const classroom = await this.db.classroom.findFirst({
      where: {
        id: args.id,
        ...(user.role === 'ADMIN'
          ? {}
          : { users: { some: { userId: user.id } } }),
      },
      include: {
        users: { include: { user: { select: memberUserSelect } } },
        announces: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!classroom) {
      throw new NotFoundException('Classroom not found or access denied')
    }

    return classroom
  }

  async getAllClassroom(ctx: Context) {
    const user = getUserFromContext(ctx)

    return this.db.classroom.findMany({
      where: { users: { some: { userId: user.id } } },
      include: {
        // Previously `user: true`, which returned every member's password hash.
        users: { include: { user: { select: memberUserSelect } } },
        announces: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async joinClassroom(args: JoinCodeArgs, ctx: Context) {
    const student = getUserFromContext(ctx)

    const classroom = await this.db.classroom.findUnique({
      where: { code: args.code.trim().toUpperCase() },
      include: {
        users: { include: { user: { select: publicUserSelect } } },
      },
    })
    if (!classroom) {
      throw new BadRequestException('Classroom not found')
    }

    if (classroom.users.some(cu => cu.userId === student.id)) {
      throw new BadRequestException('User already joined this classroom')
    }

    const teacher = classroom.users.find(cu => cu.user.role === 'TEACHER')
    if (!teacher) {
      throw new BadRequestException('Only students can join this classroom')
    }

    await this.db.$transaction([
      // A concurrent duplicate join fails on the composite primary key (409).
      this.db.classroomOnUser.create({
        data: { classroomId: classroom.id, userId: student.id },
      }),
      this.db.classroomOnUser.update({
        where: {
          userId_classroomId: {
            userId: teacher.userId,
            classroomId: classroom.id,
          },
        },
        data: { score: { increment: JOIN_REWARD_FOR_TEACHER } },
      }),
    ])

    return classroom
  }

  async getRewards(args: { classroomId: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    return this.db.$transaction(async tx => {
      const userInClass = await tx.classroomOnUser.findUnique({
        where: {
          userId_classroomId: {
            userId: user.id,
            classroomId: args.classroomId,
          },
        },
        select: { score: true, user: { select: { points: true } } },
      })

      const scoreToReward = userInClass?.score ?? 0
      if (scoreToReward <= 0) {
        return {
          rewardedScore: 0,
          pointsUser: userInClass?.user.points ?? 0,
        }
      }

      // Conditional reset guards against double-claiming from parallel requests.
      const { count } = await tx.classroomOnUser.updateMany({
        where: {
          userId: user.id,
          classroomId: args.classroomId,
          score: scoreToReward,
        },
        data: { score: 0 },
      })
      if (count === 0) {
        throw new ConflictException('Rewards were already claimed')
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { points: { increment: scoreToReward } },
        select: { points: true },
      })

      return { rewardedScore: scoreToReward, pointsUser: updatedUser.points }
    })
  }

  async rewardStudent(
    args: { classroomId: string; userId: string; pointsToAdd: number },
    ctx: Context,
  ) {
    const user = requireStaff(ctx, 'reward students')
    const points = Number(args.pointsToAdd)
    if (!Number.isInteger(points) || points <= 0) {
      throw new BadRequestException('คะแนนต้องเป็นจำนวนเต็มที่มากกว่า 0')
    }
    if (args.userId === user.id) {
      throw new BadRequestException('You cannot reward yourself')
    }

    return this.db.$transaction(async tx => {
      // The rewarding teacher must belong to the classroom.
      const debit = await tx.classroomOnUser.updateMany({
        where: { userId: user.id, classroomId: args.classroomId },
        data: { score: { decrement: points } },
      })
      if (debit.count === 0) {
        throw new NotFoundException('Classroom not found or access denied')
      }

      // Points are transferred from the teacher's (purchasable) balance; refuse
      // to overdraw it, otherwise rewards could mint unlimited points.
      const teacherBalance = await tx.user.updateMany({
        where: { id: user.id, points: { gte: points } },
        data: { points: { decrement: points } },
      })
      if (teacherBalance.count === 0) {
        throw new BadRequestException('Points ไม่เพียงพอ')
      }

      // Fails with 404 if the student is not enrolled in this classroom.
      const updatedRecord = await tx.classroomOnUser.update({
        where: {
          userId_classroomId: {
            userId: args.userId,
            classroomId: args.classroomId,
          },
        },
        data: { score: { increment: points } },
      })

      await tx.user.update({
        where: { id: args.userId },
        data: { points: { increment: points } },
      })

      return { pointsAwarded: points, currentPoints: updatedRecord.score }
    })
  }

  async getUsersByClassroomId(args: { classroomId: string }, ctx: Context) {
    const user = getUserFromContext(ctx)
    await this.assertMember(user, args.classroomId)

    return this.db.classroomOnUser.findMany({
      where: {
        classroomId: args.classroomId,
        user: { role: { not: 'TEACHER' } },
      },
      select: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  }
}
