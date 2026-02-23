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
import { customAlphabet } from 'nanoid'


@Injectable()
export class ClassroomInternalService {
  constructor(private readonly db: PrismaService) { }

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

    const nonoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6)

    let code = ''
    let isUnique = false

    while (!isUnique) {
      code = nonoid().toUpperCase()
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
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                points: true,
              }
            }
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
    const student = getUserFromContext(ctx)

    if (!student) {
      throw new UnauthorizedException('User not found')
    }

    const classroom = await this.db.classroom.findUnique({
      where: { code: args.code.toUpperCase() },
      include: {
        users: {
          include: {
            user: true,
          },
        }
      },
    })

    if (!classroom) {
      throw new BadRequestException('Classroom not found')
    }

    const isAlreadyJoined = classroom.users.some(cu => cu.userId === student.id)

    if (isAlreadyJoined) {
      throw new BadRequestException('User already joined this classroom')
    }

    const teacher = classroom.users.find(cu => cu.user.role === 'TEACHER')

    if (!teacher) {
      throw new BadRequestException('Only students can join this classroom')
    }

    await this.db.$transaction(async tx => {

      await tx.classroomOnUser.create({
        data: {
          classroomId: classroom.id,
          userId: student.id,
        },
      });

      await tx.classroomOnUser.update({
        where: {
          userId_classroomId: {
            userId: teacher.userId,
            classroomId: classroom.id,
          },
        },
        data: {
          score: {
            increment: 10,
          },
        },
      })
    })

    return classroom
  }

  // async rewardOwner(args: { classroomId: string }, ctx: Context) {
  //   const user = getUserFromContext(ctx)

  //   if (!user) {
  //     throw new UnauthorizedException('User not found')
  //   }

  //   return await this.db.$transaction(async tx => {
  //     const classroom = await tx.classroom.findUnique({
  //       where: { id: args.classroomId },
  //     })

  //     if (!classroom) {
  //       throw new BadRequestException('Classroom not found')
  //     }

  //     const unrewardedUsers = await tx.classroomOnUser.findMany({
  //       where: {
  //         classroomId: args.classroomId,
  //         userId: { not: user.id },
  //         isRewarded: false,
  //       },
  //       select: { userId: true },
  //     })

  //     const newUsersCount = unrewardedUsers.length

  //     if (newUsersCount === 0) {
  //       throw new BadRequestException('ไม่มีนักเรียนใหม่ให้รับแต้มในขณะนี้')
  //     }

  //     const pointsToAdd = newUsersCount * 10

  //     await tx.classroomOnUser.updateMany({
  //       where: {
  //         classroomId: args.classroomId,
  //         userId: { in: unrewardedUsers.map(u => u.userId) },
  //       },
  //       data: {
  //         isRewarded: true,
  //       },
  //     })

  //     const updatedOwnerRecord = await tx.classroomOnUser.update({
  //       where: {
  //         userId_classroomId: {
  //           userId: user.id,
  //           classroomId: args.classroomId,
  //         },
  //       },
  //       data: {
  //         score: {
  //           increment: pointsToAdd,
  //         },
  //       },
  //     })

  //     return {
  //       newUsersCount,
  //       pointsAwarded: pointsToAdd,
  //       currentOwnerPoints: updatedOwnerRecord.score,
  //     }
  //   })
  // } -- IGNORE --

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

  async rewardStudent(args: { classroomId: string, userId: string, pointsToAdd: number }, ctx: Context) {
    const user = getUserFromContext(ctx);
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const points = Number(args.pointsToAdd);
    if (isNaN(points) || points <= 0) {
      throw new BadRequestException('คะแนนต้องเป็นตัวเลขที่มากกว่า 0');
    }

    return await this.db.$transaction(async (tx) => {
      await tx.classroomOnUser.update({
        where: {
          userId_classroomId:
          {
            userId: user.id,
            classroomId: args.classroomId
          }
        },
        data: {
          score: { decrement: points }
        }
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          points:
            { decrement: points }
        }
      });

      const updatedRecord = await tx.classroomOnUser.update({
        where: {
          userId_classroomId:
          {
            userId: args.userId,
            classroomId: args.classroomId
          }
        },
        data: {
          score:
            { increment: points }
        },
      });

      await tx.user.update({
        where: {
          id: args.userId
        },
        data: {
          points: { increment: points }
        }
      });

      return {
        pointsAwarded: points,
        currentPoints: updatedRecord.score,
      };
    });
  }
}
