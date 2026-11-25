import { Context, getUserFromContext } from '@app/common'
import { env } from '@app/config'
import { PrismaService } from '@app/db'
import { HttpService } from '@nestjs/axios'
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'

import { SlipVerifyConfig, SlipVerifyResponse } from './internal.dto'

/** Receiving account that top-up slips must be paid to. */
const SYSTEM_BANK_CONFIG: SlipVerifyConfig = {
  bankCode: '006',
  accountNumber: '7520491552',
  promptPay: '1160101866141',
}

const TOKEN_PACKAGES = [
  { price: 10, tokens: 100 },
  { price: 100, tokens: 1010 },
  { price: 300, tokens: 3100 },
  { price: 500, tokens: 5000 },
  { price: 1000, tokens: 10000 },
] as const

const SLIP_VERIFY_TIMEOUT_MS = 15_000

const isUniqueViolation = (e: unknown) =>
  typeof e === 'object' &&
  e !== null &&
  (e as { code?: string }).code === 'P2002'

@Injectable()
export class PaymentInternalService {
  private readonly logger = new Logger(PaymentInternalService.name)

  constructor(
    private readonly db: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  private getSlipPayload(slip: string) {
    if (!slip) {
      throw new BadRequestException('ไม่พบข้อมูลสลิปที่ส่งมา')
    }
    try {
      const mimeType = slip.split(';')[0].split(':')[1]
      const slipBuffer = Buffer.from(slip.split(',')[1], 'base64')
      const imageMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']

      if (!mimeType || !slipBuffer || !imageMimeTypes.includes(mimeType)) {
        throw new Error()
      }

      return { mimeType, slipBuffer }
    } catch {
      throw new BadRequestException('รูปแบบไฟล์สลิปไม่ถูกต้อง (รองรับเฉพาะ JPEG, PNG)')
    }
  }

  private validateBank(slip: SlipVerifyResponse, config: SlipVerifyConfig) {
    const { receiver, amount, receivingBank } = slip.data
    const { bankCode, accountNumber, promptPay } = config

    if (!slip.valid) {
      throw new BadRequestException('สลิปไม่ถูกต้อง')
    }
    const accountValue = receiver.account?.value || ''
    const proxyValue = receiver.proxy?.value || ''

    if (!accountValue && !proxyValue) {
      throw new BadRequestException('ไม่พบข้อมูลบัญชีปลายทางในสลิป')
    }

    const isValidAccount = accountValue
      ? this.checkSame(accountValue, accountNumber)
      : false
    const isValidPromptPay =
      promptPay && proxyValue ? this.checkSame(proxyValue, promptPay) : false

    const isBankMatch = receivingBank === bankCode

    const isValidTransfer = isValidPromptPay || (isValidAccount && isBankMatch)

    if (!isValidTransfer) {
      throw new BadRequestException(
        `ข้อมูลผู้รับไม่ถูกต้อง (ธนาคารที่อ่านได้: ${receivingBank || 'ไม่ระบุ'})`,
      )
    }

    return amount
  }

  private async inquiry(slipBuffer: Buffer, mimeType: string) {
    try {
      const { data } = await this.httpService.axiosRef.post<SlipVerifyResponse>(
        'https://suba.rdcw.co.th/v2/inquiry',
        slipBuffer,
        {
          headers: {
            'User-Agent': 'Aidev-Classroom',
            'Content-Type': mimeType,
          },
          auth: {
            username: env.SLIP_VERIFY_CLIENT_ID,
            password: env.SLIP_VERIFY_CLIENT_SECRET,
          },
          timeout: SLIP_VERIFY_TIMEOUT_MS,
        },
      )

      return {
        discriminator: data.discriminator,
        valid: data.valid,
        data: data.data,
      }
    } catch (error) {
      this.logger.warn(`Slip inquiry failed: ${(error as Error).message}`)
      throw new InternalServerErrorException(
        'ไม่สามารถตรวจสอบสลิปได้ โปรดลองอีกครั้ง',
      )
    }
  }

  async verifyBank(slip: string, config: SlipVerifyConfig) {
    const { slipBuffer, mimeType } = this.getSlipPayload(slip)

    const maxRetries = 3
    const delayMs = 3000

    let metadata

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      metadata = await this.inquiry(slipBuffer, mimeType)

      if (metadata.valid) {
        break
      }

      if (attempt < maxRetries) {
        this.logger.log(
          `[Slip Verify] ไม่พบข้อมูลในรอบที่ ${attempt} กำลังรอ ${delayMs / 1000} วินาทีเพื่อลองใหม่...`,
        )
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }

    if (!metadata) {
      throw new InternalServerErrorException(
        'ไม่สามารถตรวจสอบสลิปได้ โปรดลองอีกครั้ง',
      )
    }

    const amount = this.validateBank(metadata, config)

    return { amount, metadata }
  }

  private checkSame(input: string, origin: string) {
    const isNumeric = (n: string) => /^[0-9]$/.test(n)

    origin = origin?.trim().replaceAll('-', '').replaceAll(' ', '')
    input = input?.trim().replaceAll('-', '').replaceAll(' ', '')

    if (origin?.length !== input?.length) {
      return false
    }
    let same = 0
    for (let i = 0; i < input.length; ++i) {
      if (isNumeric(input[i])) {
        if (input[i] !== origin[i]) {
          return false
        }
        same++
      }
    }
    if (same < 3) {
      return false
    }

    return true
  }

  async uploadSlip(slipBase64: string, ctx: Context, userId: string) {
    const user = getUserFromContext(ctx)
    if (userId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only top up your own account')
    }

    const { amount, metadata } = await this.verifyBank(
      slipBase64,
      SYSTEM_BANK_CONFIG,
    )
    const transRef = metadata.data.transRef

    const existingTransaction = await this.db.transaction.findUnique({
      where: { referenceId: transRef },
    })

    if (existingTransaction) {
      throw new BadRequestException('สลิปนี้ถูกใช้งานเติมเงินไปแล้ว')
    }

    const selectedPackage = TOKEN_PACKAGES.find(pkg => pkg.price === amount)

    if (!selectedPackage) {
      throw new BadRequestException(
        `ยอดชำระเงิน (${amount} บาท) ไม่ตรงกับแพ็กเกจที่ระบบกำหนด กรุณาติดต่อแอดมิน`,
      )
    }

    const tokensToAdd = selectedPackage.tokens

    try {
      await this.db.$transaction(async tx => {
        await tx.transaction.create({
          data: {
            userId: userId,
            amount: amount,
            tokensPoints: tokensToAdd,
            referenceId: transRef,
            status: 'SUCCESS',
          },
        })

        await tx.user.update({
          where: { id: userId },
          data: { points: { increment: tokensToAdd } },
        })
      })
    } catch (error) {
      // Same slip submitted twice concurrently: unique reference_id wins once.
      if (isUniqueViolation(error)) {
        throw new BadRequestException('สลิปนี้ถูกใช้งานเติมเงินไปแล้ว')
      }
      throw error
    }

    return {
      message: 'เติม Points สำเร็จ',
      amountPaid: amount,
      tokensReceived: tokensToAdd,
    }
  }
}
