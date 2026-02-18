import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Req,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { TutorInternalService } from './internal.service'
import { CreateTutorArgs } from './internal.dto'
import { Context } from '@app/common'

@ApiTags('Tutor - Internal')
@Controller('tutor/internal')
export class TutorInternalController {
    constructor(private readonly service: TutorInternalService) { }

    @Post('/create')
    async createTutor(@Body() args: CreateTutorArgs, @Req() ctx: Context) {
        const res = await this.service.createTutor(args, ctx)

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Get('/all')
    async getAllTutors(@Req() ctx: Context) {
        const res = await this.service.getAllTutors(ctx)

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Get('/:id')
    async getTutorById(@Req() ctx: Context, @Param('id') id: string) {
        const res = await this.service.getTutorById(id, ctx)

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Delete('/delete/:id')
    async deleteTutor(@Req() ctx: Context, @Param('id') id: string) {
        const res = await this.service.deleteTutor(id, ctx)

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Get('/content/:id')
    async getTutorContentById(@Req() ctx: Context, @Param('id') id: string) {
        const res = await this.service.getTutorContentById(id, ctx)

        return { statusCode: HttpStatus.OK, data: res }
    }
}
