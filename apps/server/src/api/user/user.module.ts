import { Module } from '@nestjs/common'

import { UserInternalController } from './internal/internal.controller'
import { UserInternalService } from './internal/internal.service'
import { UserPublicController } from './public/public.controller'
import { UserPublicService } from './public/public.service'

@Module({
  controllers: [UserPublicController, UserInternalController],
  providers: [UserPublicService, UserInternalService],
})
export class UserModule {}
