import { Module } from '@nestjs/common'
import { ItemsInternalController } from './internal/internal.controller'
import { ItemsInternalService } from './internal/internal.service'

@Module({
  controllers: [ItemsInternalController],
  providers: [ItemsInternalService],
})
export class ItemsModule {}
