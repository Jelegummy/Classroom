import { PrismaService } from '@app/db'
import { Injectable, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class TutorPublicService {
  constructor(private readonly db: PrismaService) {}

  async updateTutorBot(id: string, args: any, botSecret?: string) {
    const isValidBot = botSecret === process.env.BOT_API_SECRET // อย่าลืมใส่ BOT_API_SECRET ใน .env ของ NestJS

    let queryWhere: any = { id }

    if (!isValidBot) {
      queryWhere = {
        id,
      }
    }

    const tutor = await this.db.tutor.findUnique({
      where: queryWhere,
    })

    if (!tutor) {
      throw new UnauthorizedException(
        'Tutor not found or you have no permission',
      )
    }

    const updatedTutor = await this.db.tutor.update({
      where: { id },
      data: {
        botLink: args.botLink || tutor.botLink,
        dataContent: args.dataContent || tutor.dataContent,
        discordChannelId: args.discordChannelId || tutor.discordChannelId,
      },
    })

    return updatedTutor
  }
}
