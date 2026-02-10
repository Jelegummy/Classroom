import { getSession } from 'next-auth/react'
import { CreateGameArgs, Game, UpdateGameArgs } from './types'
import { ENDPOINT, fetchers, HttpStatus } from '@/utils'

export const createGameSession = async (args: CreateGameArgs) => {
  const session = await getSession()

  const res = await fetchers.Post<{ accessToken: string }>(
    `${ENDPOINT}/game/internal/create`,
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

export const getAllGameSessions = async () => {
  const session = await getSession()

  const res = await fetchers.Get<Game[]>(`${ENDPOINT}/game/internal/all`, {
    token: session?.user.accessToken,
  })

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}

export const getGameSession = async (id: string) => {
  const session = await getSession()

  const res = await fetchers.Get<Game>(`${ENDPOINT}/game/internal/game/${id}`, {
    token: session?.user.accessToken,
  })

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}

export const updateGameSession = async (args: Partial<UpdateGameArgs>) => {
  const session = await getSession()

  const res = await fetchers.Patch(`${ENDPOINT}/game/internal/update`, {
    data: args,
    token: session?.user.accessToken,
  })

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}

export const deleteGameSession = async (id: string) => {
  const session = await getSession()

  const res = await fetchers.Delete(`${ENDPOINT}/game/internal/delete/${id}`, {
    token: session?.user.accessToken,
  })

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }
}

export const addItemToGame = async (gameId: string, itemId: string) => {
  const session = await getSession()

  const res = await fetchers.Post<{ accessToken: string }>(
    `${ENDPOINT}/game/internal/Item/item-in-game/${gameId}/${itemId}`,
    {
      token: session?.user.accessToken,
    },
  )

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}
