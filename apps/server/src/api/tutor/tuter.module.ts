import { Module } from '@nestjs/common'
import { TutorInternalController } from './internal/internal.controller';
import { TutorInternalService } from './internal/internal.service';

@Module({
    controllers: [TutorInternalController],
    providers: [TutorInternalService],
})
export class TutorModule { }