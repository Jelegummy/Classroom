import { Context, assertOwnerOrAdmin, getUserFromContext } from '@app/common'
import { PrismaService } from '@app/db'
import { Injectable, NotFoundException } from '@nestjs/common'

import { CreateTutorArgs } from './internal.dto'

// Previously `host: true`, which returned the host's password hash.
const hostSelect = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    role: true,
    discordId: true,
  },
} as const

@Injectable()
export class TutorInternalService {
  constructor(private readonly db: PrismaService) {}

  async createTutor(args: CreateTutorArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    // Students may host peer-tutoring sessions, but only in their own classrooms.
    if (user.role !== 'ADMIN') {
      const membership = await this.db.classroomOnUser.findUnique({
        where: {
          userId_classroomId: {
            userId: user.id,
            classroomId: args.classroomId,
          },
        },
        select: { userId: true },
      })
      if (!membership) {
        throw new NotFoundException('Classroom not found or access denied')
      }
    }

    return this.db.$transaction(async tx => {
      const tutor = await tx.tutor.create({
        data: {
          botLink: args.botLink,
          startTime: args.startTime,
          dataContent: args.dataContent || '',
          discordChannelId: args.discordChannelId || '',
          inviteLink: args.inviteLink || '',
          name: args.name || '',
          host: { connect: { id: user.id } },
        },
      })

      await tx.classroomOnTutor.create({
        data: { tutorId: tutor.id, classroomId: args.classroomId },
      })

      return tutor
    })
  }

  async getAllTutors(ctx: Context, classroomId?: string) {
    const user = getUserFromContext(ctx)

    return this.db.tutor.findMany({
      where: {
        host: { schoolId: user.schoolId },
        classroomSessions: { some: classroomId ? { classroomId } : {} },
      },
      include: {
        host: hostSelect,
        classroomSessions: {
          where: classroomId ? { classroomId } : {},
          include: { classroom: true },
        },
        voiceLogs: { select: { voiceChannelName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getTutorById(id: string, ctx: Context) {
    const user = getUserFromContext(ctx)

    const tutor = await this.db.tutor.findFirst({
      where: { id, host: { schoolId: user.schoolId } },
      include: {
        host: hostSelect,
        classroomSessions: { include: { classroom: true } },
      },
    })
    if (!tutor) {
      throw new NotFoundException('Tutor not found')
    }

    return tutor
  }

  async deleteTutor(id: string, ctx: Context) {
    const user = getUserFromContext(ctx)

    const tutor = await this.db.tutor.findUnique({
      where: { id },
      select: { hostId: true },
    })
    if (!tutor) {
      throw new NotFoundException('Tutor not found')
    }
    // Previously any authenticated user could delete any session.
    assertOwnerOrAdmin(
      user,
      tutor.hostId,
      'Only the host can delete this session',
    )

    await this.db.$transaction([
      this.db.attendance.deleteMany({
        where: { activeTutor: { tutorId: id } },
      }),
      this.db.classroomOnTutor.deleteMany({ where: { tutorId: id } }),
      this.db.tutor.delete({ where: { id } }), // voice logs cascade
    ])
  }

  async getTutorContentById(id: string, ctx: Context) {
    getUserFromContext(ctx)

    const tutorContent = await this.db.tutorVoiceLog.findMany({
      where: { tutorId: id },
      orderBy: { createdAt: 'asc' },
    })
    if (tutorContent.length === 0) {
      throw new NotFoundException('Tutor content not found')
    }

    return tutorContent
  }

  async getTutorContentUserById(id: string, ctx: Context) {
    getUserFromContext(ctx)

    const activeTutorSession = await this.db.classroomOnTutor.findFirst({
      where: { tutorId: id },
      select: { id: true },
    })
    if (!activeTutorSession) {
      throw new NotFoundException('ไม่พบเซสชันการสอนสำหรับ Tutor นี้')
    }

    const participants = await this.db.attendance.findMany({
      where: { activeTutorId: activeTutorSession.id, scoreEarned: { gt: 0 } },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, points: true },
        },
      },
      orderBy: { scoreEarned: 'desc' },
    })

    return participants.map(record => ({
      userId: record.user.id,
      fullName: `${record.user.firstName} ${record.user.lastName || ''}`.trim(),
      scoreEarnedInSession: record.scoreEarned,
      totalUserPoints: record.user.points,
    }))
  }
}
