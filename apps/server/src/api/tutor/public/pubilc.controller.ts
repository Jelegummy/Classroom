import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { CreateTutorVoiceLogArgs } from './pubilc.dto'
import { TutorPublicService } from './pubilc.service'

@ApiTags('Tutor - Public')
@Controller('tutor/public')
export class TutorPublicController {
  constructor(private readonly service: TutorPublicService) {}

  @Post('/:id/bot/logs')
  async createTutorBot(
    @Param('id') id: string,
    @Body() args: CreateTutorVoiceLogArgs,
    @Headers('x-bot-secret') botSecret?: string,
  ) {
    const res = await this.service.createTutorBot(id, args, botSecret)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Get('channel/:channelId/active')
  async getActiveTutorId(@Param('channelId') channelId: string) {
    const res = await this.service.getActiveTutorId(channelId)

    return { statusCode: HttpStatus.OK, data: res }
  }
}
