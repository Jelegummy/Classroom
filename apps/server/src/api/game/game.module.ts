import { Module } from '@nestjs/common'
import { GameInternalController } from './internal/internal.controller'
import { GameInternalService } from './internal/internal.service'

@Module({
  controllers: [GameInternalController],
  providers: [GameInternalService],
})
export class GameModule {}
