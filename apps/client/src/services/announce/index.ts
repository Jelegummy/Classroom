import { getSession } from 'next-auth/react'
import { Announce, CreateAnnounceArgs, UpdateAnnounceArgs } from './types'
import { ENDPOINT, fetchers, HttpStatus } from '@/utils'

export const createAnnounce = async (args: CreateAnnounceArgs) => {
  const session = await getSession()

  const res = await fetchers.Post<{ accessToken: string }>(
    `${ENDPOINT}/announce/internal/create`,
    {
      data: args,
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }
} // use for creating announce

export const updateAnnounce = async (args: UpdateAnnounceArgs) => {
  const session = await getSession()

  const res = await fetchers.Patch<{ accessToken: string }>(
    `${ENDPOINT}/announce/internal/update/${args.id}`,
    {
      data: args,
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }
} // use for updating announce

export const deleteAnnounce = async (id: string) => {
  const session = await getSession()

  const res = await fetchers.Delete<{ accessToken: string }>(
    `${ENDPOINT}/announce/internal/delete/${id}`,
    {
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }
} // use for deleting announce

export const getAnnounce = async (id: string) => {
  const session = await getSession()

  const res = await fetchers.Get<Announce>(
    `${ENDPOINT}/announce/internal/${id}`,
    {
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
} // use for getting announce by id

export const getAllAnnounces = async () => {
  const session = await getSession()

  const res = await fetchers.Get<Announce[]>(
    `${ENDPOINT}/announce/internal/all`,
    {
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
} // use for getting all announces
