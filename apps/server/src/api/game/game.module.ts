import { Module } from '@nestjs/common'
import { GameInternalController } from './internal/internal.controller'
import { GameInternalService } from './internal/internal.service'
import { GameGateway } from './internal/game.gateway'

@Module({
  controllers: [GameInternalController],
  providers: [GameInternalService, GameGateway],
  exports: [GameGateway, GameInternalService],
})
export class GameModule {}
