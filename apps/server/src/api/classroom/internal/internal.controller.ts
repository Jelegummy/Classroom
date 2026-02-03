import { Context } from "@app/common";
import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateClassroomArgs, JoinCodeArgs, UpdateClassroomArgs } from "./internal.dto";
import { ClassroomInternalService } from "./internal.service";

@ApiTags('Classroom - Internal')
@Controller('classroom/internal')
export class ClassroomInternalController {
    constructor(private readonly service: ClassroomInternalService) { }

    @Post('/create')
    async createClassroom(@Body() args: CreateClassroomArgs, @Req() ctx: Context) {
        const res = await this.service.createClassroom(args, ctx);

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Patch('/update')
    async updateClassroom(@Body() args: UpdateClassroomArgs, @Req() ctx: Context) {
        await this.service.updateClassroom(args, ctx);

        return { statusCode: HttpStatus.OK }
    }

    @Delete('/delete/:id')
    async deleteClassroom(@Param('id') id: string, @Req() ctx: Context) {
        await this.service.deleteClassroom({ id }, ctx);

        return { statusCode: HttpStatus.OK }
    }

    @Get('/classroom/:id')
    async getClassroom(@Param('id') id: string, @Req() ctx: Context) {
        const res = await this.service.getClassroom({ id }, ctx);

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Get('/all')
    async getAllClassroom(@Req() ctx: Context) {
        const res = await this.service.getAllClassroom(ctx);

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Post('/join/code')
    async joinClassroom(@Body() args: JoinCodeArgs, @Req() ctx: Context) {
        const res = await this.service.joinClassroom(args, ctx);

        return { statusCode: HttpStatus.OK, data: res }
    }
}