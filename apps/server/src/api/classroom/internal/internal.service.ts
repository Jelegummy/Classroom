import { PrismaService } from '@app/db'
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import {
  CreateClassroomArgs,
  JoinCodeArgs,
  UpdateClassroomArgs,
} from './internal.dto'
import { Context, getUserFromContext } from '@app/common'
import { nanoid } from 'nanoid'

@Injectable()
export class ClassroomInternalService {
  constructor(private readonly db: PrismaService) {}

  async createClassroom(args: CreateClassroomArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only teachers and admins can create classrooms',
      )
    }

    let code = ''
    let isUnique = false

    while (!isUnique) {
      code = nanoid(6).toUpperCase()
      const existing = await this.db.classroom.findUnique({ where: { code } })
      if (!existing) isUnique = true
    }

    const userWithSchool = await this.db.user.findUnique({
      where: { id: user.id },
      select: { schoolId: true },
    })

    if (!userWithSchool?.schoolId) {
      throw new BadRequestException('User school not found')
    }

    const classroom = await this.db.classroom.create({
      data: {
        name: args.name,
        code: code,
        title: args.title,

        school: {
          connect: { id: userWithSchool.schoolId },
        },
        users: {
          create: {
            user: {
              connect: { id: user.id },
            },
          },
        },
      },
      include: {
        users: true,
      },
    })

    return classroom
  }

  async updateClassroom(args: UpdateClassroomArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new Error('Only teachers and admins can update classrooms')
    }

    const classroom = await this.db.classroom.findUnique({
      where: { id: args.id },
      include: { users: true },
    })

    if (!classroom) {
      throw new Error('Classroom not found')
    }

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
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new Error('Only teachers and admins can delete classrooms')
    }

    const classroom = await this.db.classroom.findFirst({
      where: {
        id: args.id,
        users: {
          some: {
            userId: user.id,
          },
        },
      },
    })

    if (!classroom) {
      throw new Error('Classroom not found')
    }

    await this.db.classroom.delete({
      where: { id: args.id },
    })
  }

  async getClassroom(args: { id: string }, ctx: Context) {
    const user = getUserFromContext(ctx)
    if (!user) throw new Error('User not found')

    const classroom = await this.db.classroom.findFirst({
      where: {
        id: args.id,
        users: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
        announces: true,
      },
    })

    if (!classroom) {
      throw new Error('Classroom not found or access denied')
    }

    return classroom
  }

  async getAllClassroom(ctx: Context) {
    const user = getUserFromContext(ctx)
    if (!user) throw new Error('User not found')

    const classrooms = await this.db.classroom.findMany({
      where: {
        users: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
        announces: true,
      },
    })

    return classrooms
  }

  async joinClassroom(args: JoinCodeArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const classroom = await this.db.classroom.findUnique({
      where: { code: args.code.toUpperCase() },
      include: { users: true },
    })

    if (!classroom) {
      throw new BadRequestException('Classroom not found')
    }

    const isAlreadyJoined = classroom.users.some(cu => cu.userId === user.id)

    if (isAlreadyJoined) {
      throw new BadRequestException('User already joined this classroom')
    }

    await this.db.classroomOnUser.create({
      data: {
        classroom: {
          connect: { id: classroom.id },
        },
        user: {
          connect: { id: user.id },
        },
      },
    })

    return classroom
  }

  async rewardOwner(args: { classroomId: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return await this.db.$transaction(async tx => {
      const classroom = await tx.classroom.findUnique({
        where: { id: args.classroomId },
      })

      if (!classroom) {
        throw new BadRequestException('Classroom not found')
      }

      const unrewardedUsers = await tx.classroomOnUser.findMany({
        where: {
          classroomId: args.classroomId,
          userId: { not: user.id },
          isRewarded: false,
        },
        select: { userId: true },
      })

      const newUsersCount = unrewardedUsers.length

      if (newUsersCount === 0) {
        throw new BadRequestException('ไม่มีนักเรียนใหม่ให้รับแต้มในขณะนี้')
      }

      const pointsToAdd = newUsersCount * 10

      await tx.classroomOnUser.updateMany({
        where: {
          classroomId: args.classroomId,
          userId: { in: unrewardedUsers.map(u => u.userId) },
        },
        data: {
          isRewarded: true,
        },
      })

      const updatedOwnerRecord = await tx.classroomOnUser.update({
        where: {
          userId_classroomId: {
            userId: user.id,
            classroomId: args.classroomId,
          },
        },
        data: {
          score: {
            increment: pointsToAdd,
          },
        },
      })

      return {
        newUsersCount,
        pointsAwarded: pointsToAdd,
        currentOwnerPoints: updatedOwnerRecord.score,
      }
    })
  }

  async getRewards(args: { classroomId: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const userInClass = await this.db.classroomOnUser.findUnique({
      where: {
        userId_classroomId: {
          userId: user.id,
          classroomId: args.classroomId,
        },
      },
      select: { score: true },
    })

    return userInClass?.score || 0
  }

  async rewardStudent(args: { classroomId: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const classroom = await this.db.classroom.findUnique({
      where: { id: args.classroomId },
      include: {
        users: true,
      },
    })

    if (!classroom) {
      throw new BadRequestException('Classroom not found')
    }

    const isJoined = classroom.users.some(cu => cu.userId === user.id)

    if (!isJoined) {
      throw new BadRequestException('User has not joined this classroom')
    }

    const pointsToAdd = 10

    const updatedRecord = await this.db.classroomOnUser.update({
      where: {
        userId_classroomId: {
          userId: user.id,
          classroomId: args.classroomId,
        },
      },
      data: {
        score: {
          increment: pointsToAdd,
        },
      },
    })

    return {
      pointsAwarded: pointsToAdd,
      currentPoints: updatedRecord.score,
    }
  } //TODO : not yet
}
