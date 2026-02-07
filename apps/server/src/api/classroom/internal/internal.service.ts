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
}
