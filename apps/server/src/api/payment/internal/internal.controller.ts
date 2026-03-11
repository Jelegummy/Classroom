import { Body, Controller, HttpStatus, Param, Post, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { read } from 'fs'
import { PaymentInternalService } from './internal.service'
import { Context } from '@app/common'
import { UploadSlipArgs } from './internal.dto'

@ApiTags('Payment - Internal')
@Controller('payment/internal')
export class PaymentInternalController {
  constructor(private readonly service: PaymentInternalService) {}

  @Post('/upload-slip')
  async uploadSlip(@Body() args: UploadSlipArgs, @Req() ctx: Context) {
    const slipBase64 = args?.slip
    const userId = args?.id

    const res = await this.service.uploadSlip(slipBase64, ctx, userId)

    return { statusCode: HttpStatus.OK, data: res }
  }
}
