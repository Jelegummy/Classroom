import { PrismaService } from '@app/db'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { CreateTutorArgs } from './internal.dto'
import { Context, getUserFromContext } from '@app/common'

@Injectable()
export class TutorInternalService {
  constructor(private readonly db: PrismaService) {}

  async createTutor(args: CreateTutorArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const tutor = await this.db.tutor.create({
      data: {
        botLink: args.botLink,
        startTime: args.startTime,
        dataContent: args.dataContent || '',
        discordChannelId: args.discordChannelId || '',
        host: {
          connect: { id: user.id },
        },
      },
    })

    await this.db.classroomOnTutor.create({
      data: {
        tutorId: tutor.id,
        classroomId: args.classroomId,
      },
    })

    return tutor
  }

  async getAllTutors(ctx: Context, classroomId?: string) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const tutors = await this.db.tutor.findMany({
      where: {
        host: {
          schoolId: user.schoolId,
        },
        classroomSessions: {
          some: {
            classroomId: classroomId,
          },
        },
      },
      include: {
        host: true,
        classroomSessions: {
          where: {
            classroomId: classroomId,
          },
          include: {
            classroom: true,
          },
        },
      },
    })

    return tutors
  }

  async getTutorById(id: string, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const tutor = await this.db.tutor.findUnique({
      where: {
        id,
        host: {
          schoolId: user.schoolId,
        },
      },
      include: {
        host: true,
        classroomSessions: {
          include: {
            classroom: true,
          },
        },
      },
    })

    if (!tutor) {
      throw new UnauthorizedException('Tutor not found')
    }

    return tutor
  }

  async deleteTutor(id: string, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    await this.db.classroomOnTutor.deleteMany({
      where: {
        tutorId: id,
      },
    })

    await this.db.tutor.delete({
      where: {
        id,
      },
    })
  }

  async getTutorContentById(id: string, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const tutorContent = await this.db.tutorVoiceLog.findMany({
      where: {
        tutorId: id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (tutorContent.length === 0) {
      throw new NotFoundException('Tutor content not found')
    }

    return tutorContent
  } // get tutor content by tutor id

  async getTutorContentUserById(id: string, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const activeTutorSession = await this.db.classroomOnTutor.findFirst({
      where: { tutorId: id },
    })

    if (!activeTutorSession) {
      throw new NotFoundException('ไม่พบเซสชันการสอนสำหรับ Tutor นี้')
    }

    const participants = await this.db.attendance.findMany({
      where: {
        activeTutorId: activeTutorSession.id,
        scoreEarned: { gt: 0 },
      },
      include: {
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
        scoreEarned: 'desc',
      },
    })

    return participants.map(record => ({
      userId: record.user.id,
      fullName: `${record.user.firstName} ${record.user.lastName || ''}`.trim(),
      scoreEarnedInSession: record.scoreEarned,
      totalUserPoints: record.user.points,
    }))
  }
}
