import { Module } from "@nestjs/common";
import { AttendanceInternalController } from "./internal/internal.controller";
import { AttendanceInternalService } from "./internal/internal.service";

@Module({
    controllers: [AttendanceInternalController],
    providers: [AttendanceInternalService],
})

export class AttendanceModule { }