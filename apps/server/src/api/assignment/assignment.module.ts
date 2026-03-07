import { Module } from '@nestjs/common'
import { AssignmentInternalController } from './internal/internal.controller'
import { AssignmentInternalService} from './internal/internal.service'

@Module({
  controllers: [AssignmentInternalController],
  providers: [AssignmentInternalService],
})
export class AssignmentModule {}
