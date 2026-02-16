import { Module } from '@nestjs/common'
import { TutorInternalController } from './internal/internal.controller'
import { TutorInternalService } from './internal/internal.service'
import { TutorPublicController } from './public/pubilc.controller'
import { TutorPublicService } from './public/pubilc.service'

@Module({
  controllers: [TutorInternalController, TutorPublicController],
  providers: [TutorInternalService, TutorPublicService],
})
export class TutorModule {}
