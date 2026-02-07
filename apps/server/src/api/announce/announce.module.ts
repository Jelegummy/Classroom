import { Module } from "@nestjs/common";
import { AnnounceInternalController } from "./internal/internal.controller";
import { AnnounceInternalService } from "./internal/internal.service";

@Module({
    controllers: [AnnounceInternalController],
    providers: [AnnounceInternalService],
})
export class AnnounceModule { }