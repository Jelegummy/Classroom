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
}

export type UploadSlipArgs = {
  slip: string
  id: string
}
