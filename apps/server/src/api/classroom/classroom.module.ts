import { Module } from "@nestjs/common";
import { ClassroomInternalController } from "./internal/internal.controller";
import { ClassroomInternalService } from "./internal/internal.service";

@Module({
    controllers: [ClassroomInternalController],
    providers: [ClassroomInternalService],
})
export class ClassroomModule { }