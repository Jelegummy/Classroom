import { Module } from '@nestjs/common'

import { GameGateway } from './internal/game.gateway'
import { GameInternalController } from './internal/internal.controller'
import { GameInternalService } from './internal/internal.service'

@Module({
  controllers: [GameInternalController],
  providers: [GameInternalService, GameGateway],
  exports: [GameGateway, GameInternalService],
})
export class GameModule {}
