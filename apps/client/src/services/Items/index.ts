import { ENDPOINT, fetchers, HttpStatus } from '@/utils'
import { getSession } from 'next-auth/react'
import { BuyItems, Items } from './types'

export const buyItems = async (args: BuyItems) => {
  const session = await getSession()

  const res = await fetchers.Post<void>(
    `${ENDPOINT}/items/internal/buy-items`,
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

export const getAllItems = async () => {
  const session = await getSession()

  const res = await fetchers.Get<Items[]>(`${ENDPOINT}/items/internal/all`, {
    token: session?.user.accessToken,
  })

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}

export const getItems = async (id: string) => {
  const session = await getSession()

  const res = await fetchers.Get<Items>(
    `${ENDPOINT}/items/internal/item/${id}`,
    {
      token: session?.user.accessToken,
    },
  )

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}
