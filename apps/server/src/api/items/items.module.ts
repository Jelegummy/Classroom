import { Module } from '@nestjs/common'
import { ItemsInternalController } from './internal/internal.controller'
import { ItemsInternalService } from './internal/internal.service'
import { GameModule } from '../game/game.module'

@Module({
  imports: [GameModule],
  controllers: [ItemsInternalController],
  providers: [ItemsInternalService],
})
export class ItemsModule {}
