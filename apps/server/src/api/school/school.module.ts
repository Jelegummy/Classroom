import { Module } from '@nestjs/common'

import { SchoolPublicController } from './public/public.controller'
import { SchoolPublicService } from './public/public.service'
import { SchoolInternalController } from './internal/internal.controller'
import { SchoolInternalService } from './internal/internal.service'

@Module({
  controllers: [SchoolPublicController, SchoolInternalController],
  providers: [SchoolPublicService, SchoolInternalService],
})
export class SchoolModule {}

//Not used yet
