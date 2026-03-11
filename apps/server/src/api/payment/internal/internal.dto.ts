import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export type SlipVerifyResponse = {
  discriminator: string
  valid: boolean
  data: {
    ref1: string | null
    ref2: string | null
    ref3: string | null
    amount: number
    sender: {
      name: string | null
      proxy: {
        type: string | null
        value: string | null
      }
      account: {
        type: string | null
        value: string | null
      }
      displayName: string | null
    }
    language: string | null
    receiver: {
      name: string | null
      proxy: {
        type: string | null
        value: string | null
      }
      account: {
        type: string | null
        value: string | null
      }
      displayName: string | null
    }
    transRef: string
    transDate: string
    transTime: string
    countryCode: string
    sendingBank: string
    toMerchantId: string | null
    receivingBank: string | null
    transFeeAmount: number | null
    paidLocalAmount: number | null
    paidLocalCurrency: string | null
  }
}

export type SlipVerifyConfig = {
  bankCode: string
  accountNumber: string
  promptPay?: string
}

export class UploadSlipArgs extends createZodDto(
  z.object({
    slip: z.string().min(1),
    id: z.string().min(1),
  }),
) {}

patchNestJsSwagger()
