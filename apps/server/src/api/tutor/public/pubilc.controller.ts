import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { TutorPublicService } from './pubilc.service'

@ApiTags('Tutor - Public')
@Controller('tutor/public')
export class TutorPublicController {
  constructor(private readonly service: TutorPublicService) {}

  @Patch('/:id/bot')
  async updateTutorBot(
    @Param('id') id: string,
    @Body() args: any,
    @Headers('x-bot-secret') botSecret: 'super-secret-bot-key',
  ) {
    const res = await this.service.updateTutorBot(id, args, botSecret)

    return { statusCode: HttpStatus.OK, data: res }
  }
}
