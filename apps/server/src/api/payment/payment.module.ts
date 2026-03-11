import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { PaymentInternalController } from './internal/internal.controller'
import { PaymentInternalService } from './internal/internal.service'

@Module({
  imports: [HttpModule],
  controllers: [PaymentInternalController],
  providers: [PaymentInternalService],
})
export class PaymentModule {}
