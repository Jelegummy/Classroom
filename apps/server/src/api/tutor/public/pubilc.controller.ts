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
import { CreateTutorVoiceLogArgs } from './pubilc.dto'

@ApiTags('Tutor - Public')
@Controller('tutor/public')
export class TutorPublicController {
    constructor(private readonly service: TutorPublicService) { }

    @Post('/:id/bot/logs')
    async createTutorBot(
        @Param('id') id: string,
        @Body() args: CreateTutorVoiceLogArgs,
        @Headers('x-bot-secret') botSecret: 'super-secret-bot-key',
    ) {
        const res = await this.service.createTutorBot(id, args, botSecret)

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Get('channel/:channelId/active')
    async getActiveTutorId(@Param('channelId') channelId: string) {
        const res = await this.service.getActiveTutorId(channelId);

        return { statusCode: HttpStatus.OK, data: res };
    }
}
