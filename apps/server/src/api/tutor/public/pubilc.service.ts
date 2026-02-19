import { PrismaService } from '@app/db'
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { CreateTutorVoiceLogArgs } from './pubilc.dto'

@Injectable()
export class TutorPublicService {
  constructor(private readonly db: PrismaService) {}

  async createTutorBot(
    id: string,
    args: CreateTutorVoiceLogArgs,
    botSecret?: string,
  ) {
    if (botSecret !== 'super-secret-bot-key') {
      throw new UnauthorizedException('Invalid bot secret')
    }
    const tutor = await this.db.tutorVoiceLog.create({
      data: {
        tutorId: id,
        topic: args.topic,
        summary: args.summary,
        dataContent: args.dataContent,
      },
    })

    const content =
      typeof args.dataContent === 'string'
        ? JSON.parse(args.dataContent)
        : args.dataContent

    const roles = content?.roles

    if (roles) {
      const activeTutorSession = await this.db.classroomOnTutor.findFirst({
        where: { tutorId: id },
      })

      if (activeTutorSession) {
        const classroomId = activeTutorSession.classroomId
        const activeTutorId = activeTutorSession.id

        const prepareScoreQueries = async (
          fullName: string,
          pointsEarned: number,
        ) => {
          const nameParts = fullName.trim().split(/\s+/)

          const searchFirstName = nameParts[0] || ''
          const searchLastName = nameParts.slice(1).join(' ') || ''

          const user = await this.db.user.findFirst({
            where: {
              firstName: searchFirstName,
              ...(searchLastName ? { lastName: searchLastName } : {}),
            },
          })

          if (!user) {
            throw new NotFoundException(
              `User with name "${fullName}" not found`,
            )
          }

          return [
            this.db.user.update({
              where: { id: user.id },
              data: { points: { increment: pointsEarned } },
            }),

            this.db.classroomOnUser.update({
              where: {
                userId_classroomId: {
                  userId: user.id,
                  classroomId: classroomId,
                },
              },
              data: { score: { increment: pointsEarned } },
            }),

            this.db.attendance.upsert({
              where: {
                userId_activeTutorId: {
                  userId: user.id,
                  activeTutorId: activeTutorId,
                },
              },
              update: {
                scoreEarned: { increment: pointsEarned },
              },
              create: {
                userId: user.id,
                activeTutorId: activeTutorId,
                scoreEarned: pointsEarned,
                status: 'PRESENT',
              },
            }),
          ]
        }

        const allTransactions = []

        if (roles.main_speaker && typeof roles.main_speaker === 'string') {
          const queries = await prepareScoreQueries(roles.main_speaker, 5)
          allTransactions.push(...queries)
        }

        if (Array.isArray(roles.active_participants)) {
          for (const name of roles.active_participants) {
            const queries = await prepareScoreQueries(name, 3)
            allTransactions.push(...queries)
          }
        }

        if (Array.isArray(roles.silent_participants)) {
          for (const name of roles.silent_participants) {
            const queries = await prepareScoreQueries(name, 1)
            allTransactions.push(...queries)
          }
        }

        if (allTransactions.length > 0) {
          try {
            await this.db.$transaction(allTransactions)
          } catch (e) {
            throw new NotFoundException('เกิดข้อผิดพลาดในการแจกคะแนน: ' + e)
          }
        }
      }
    }

    return tutor
  } // create tutor bot and points to students based on roles

  async getActiveTutorId(channelId: string) {
    const activeSession = await this.db.tutor.findFirst({
      where: {
        discordChannelId: channelId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!activeSession) {
      throw new NotFoundException('ไม่พบ Session ที่กำลังทำงานสำหรับห้องนี้')
    }

    return { tutorId: activeSession.id }
  }
}
