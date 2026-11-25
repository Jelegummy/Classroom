import { Context } from '@app/common'
import { Body, Controller, HttpStatus, Post, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { UploadSlipArgs } from './internal.dto'
import { PaymentInternalService } from './internal.service'

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
