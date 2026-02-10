import { Module } from '@nestjs/common'
import { CharacterInternalController } from './internal/internal.controller'
import { CharacterInternalService } from './internal/internal.service'

@Module({
  controllers: [CharacterInternalController],
  providers: [CharacterInternalService],
})
export class CharacterModule {}
