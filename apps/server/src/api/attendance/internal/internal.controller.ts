import { Body, Controller, HttpStatus, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AttendanceInternalService } from "./internal.service";
import { CreateGameAttendanceDto } from "./internal.dto";
import { Context } from "@app/common";

@ApiTags("Attendance - Internal")
@Controller("attendance/internal")
export class AttendanceInternalController {
    constructor(private readonly service: AttendanceInternalService) { }

    @Post('/game-attendance')
    async createGameAttendance(@Body() args: CreateGameAttendanceDto, @Req() ctx: Context) {
        const res = await this.service.createGameAttendance(args, ctx)

        return { statusCode: HttpStatus.OK, data: res }
    }
}