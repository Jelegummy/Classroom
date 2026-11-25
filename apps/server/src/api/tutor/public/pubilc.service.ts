import { assertBotSecret } from '@app/common'
import { env } from '@app/config'
import { PrismaService } from '@app/db'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'

import { CreateTutorVoiceLogArgs } from './pubilc.dto'

/** Points per role detected by the Discord bot's AI analysis. */
const ROLE_POINTS = {
  main_speaker: 5,
  active_participants: 3,
  silent_participants: 1,
} as const

type Roles = {
  main_speaker?: unknown
  active_participants?: unknown
  silent_participants?: unknown
}

const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ')

/** name -> points, keeping the highest role if a name appears more than once. */
const collectAwards = (roles: Roles) => {
  const awards = new Map<string, number>()
  const add = (name: unknown, points: number) => {
    if (typeof name !== 'string' || !name.trim()) {
      return
    }
    const key = normalizeName(name)
    awards.set(key, Math.max(awards.get(key) ?? 0, points))
  }

  add(roles.main_speaker, ROLE_POINTS.main_speaker)
  for (const key of ['active_participants', 'silent_participants'] as const) {
    const names = roles[key]
    if (Array.isArray(names)) {
      names.forEach(name => add(name, ROLE_POINTS[key]))
    }
  }

  return awards
}

@Injectable()
export class TutorPublicService {
  private readonly logger = new Logger(TutorPublicService.name)

  constructor(private readonly db: PrismaService) {}

  async createTutorBot(
    id: string,
    args: CreateTutorVoiceLogArgs,
    botSecret?: string,
  ) {
    assertBotSecret(botSecret, env.BOT_API_SECRET)

    const tutorExists = await this.db.tutor.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!tutorExists) {
      throw new NotFoundException('Tutor session not found')
    }

    const content =
      typeof args.dataContent === 'string'
        ? JSON.parse(args.dataContent)
        : args.dataContent
    const roles: Roles | undefined = content?.roles

    return this.db.$transaction(async tx => {
      const voiceLog = await tx.tutorVoiceLog.create({
        data: {
          tutorId: id,
          topic: args.topic,
          summary: args.summary,
          audioUrl: args.audioUrl,
          dataContent: args.dataContent,
          voiceChannelName: args.voiceChannelName,
        },
      })

      const session = roles
        ? await tx.classroomOnTutor.findFirst({
            where: { tutorId: id },
            select: { id: true, classroomId: true },
          })
        : null

      const unmatched: string[] = []
      if (roles && session) {
        const awards = collectAwards(roles)

        // Only match names against students enrolled in this classroom; the
        // previous global first-name lookup could credit the wrong person.
        const members = await tx.classroomOnUser.findMany({
          where: { classroomId: session.classroomId },
          select: {
            userId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        })
        const byName = new Map<string, string>()
        for (const m of members) {
          const full = normalizeName(`${m.user.firstName} ${m.user.lastName}`)
          byName.set(full, m.userId)
          if (!byName.has(m.user.firstName)) {
            byName.set(m.user.firstName, m.userId)
          }
        }

        for (const [name, points] of awards) {
          const userId = byName.get(name)
          if (!userId) {
            unmatched.push(name)
            continue
          }

          await tx.user.update({
            where: { id: userId },
            data: { points: { increment: points } },
          })
          await tx.classroomOnUser.update({
            where: {
              userId_classroomId: { userId, classroomId: session.classroomId },
            },
            data: { score: { increment: points } },
          })
          await tx.attendance.upsert({
            where: {
              userId_activeTutorId: { userId, activeTutorId: session.id },
            },
            update: { scoreEarned: { increment: points } },
            create: {
              userId,
              activeTutorId: session.id,
              scoreEarned: points,
              status: 'PRESENT',
            },
          })
        }
      }

      if (unmatched.length > 0) {
        this.logger.warn(
          `Tutor ${id}: no enrolled user matched ${unmatched.join(', ')}`,
        )
      }

      return { ...voiceLog, unmatchedParticipants: unmatched }
    })
  }

  async getActiveTutorId(channelId: string) {
    const activeSession = await this.db.tutor.findFirst({
      where: { discordChannelId: channelId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        host: { select: { firstName: true, lastName: true, discordId: true } },
      },
    })
    if (!activeSession) {
      throw new NotFoundException('ไม่พบ Session ที่กำลังทำงานสำหรับห้องนี้')
    }

    return {
      tutorId: activeSession.id,
      discordId: activeSession.host.discordId,
      hostName: `${activeSession.host.firstName} ${activeSession.host.lastName}`,
    }
  }
}
