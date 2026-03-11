import { ENDPOINT, fetchers, HttpStatus } from '@/utils'
import { getSession } from 'next-auth/react'
import { UploadSlipArgs } from './types'

export const uploadSlip = async (args: UploadSlipArgs) => {
  const session = await getSession()

  const res = await fetchers.Post<UploadSlipArgs>(
    `${ENDPOINT}/payment/internal/upload-slip`,
    {
      data: args,
      token: session?.user.accessToken,
    },
  )

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}
