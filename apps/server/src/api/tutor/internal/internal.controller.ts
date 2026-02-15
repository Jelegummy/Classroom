import { Body, Controller, Get, Headers, HttpStatus, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TutorInternalService } from "./internal.service";
import { CreateTutorArgs } from "./internal.dto";
import { Context } from "@app/common";

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

    // @Patch('/:id/bot')
    // async updateTutorBot(
    //     @Req() ctx: Context,
    //     @Param('id') id: string,
    //     @Body() args: any,
    //     @Headers('x-bot-secret') botSecret: "super-secret-bot-key",
    // ) {
    //     const res = await this.service.updateTutorBot(id, args, ctx, botSecret);

    //     return { statusCode: HttpStatus.OK, data: res };
    // }
}