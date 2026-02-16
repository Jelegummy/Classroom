import { getSession } from 'next-auth/react'
import {
  CreateGameArgs,
  CreateGameResponse,
  Game,
  GameLeaderboardResponse,
  Leader,
  UpdateGameArgs,
} from './types'
import { ENDPOINT, fetchers, HttpStatus } from '@/utils'

export const createGameSession = async (args: CreateGameArgs) => {
  const session = await getSession()

  const res = await fetchers.Post<CreateGameResponse>(
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

export const attackBoss = async (gameId: string, damage: number) => {
  const session = await getSession()

  const res = await fetchers.Post<{ currentHp: number }>(
    `${ENDPOINT}/game/internal/attack`,
    {
      data: { gameId, damage },
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

export const getGameLeaderboard = async (gameId: string) => {
  const session = await getSession()

  const res = await fetchers.Get<GameLeaderboardResponse>(
    `${ENDPOINT}/game/internal/leaderboard/${gameId}`,
    {
      token: session?.user.accessToken,
    },
  )

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}

export const joinGame = async (gameId: string) => {
  const session = await getSession()

  const res = await fetchers.Post<{ accessToken: string }>(
    `${ENDPOINT}/game/internal/join/${gameId}`,
    {
      token: session?.user.accessToken,
    },
  )

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}

export const startGame = async (gameId: string) => {
  const session = await getSession()

  const res = await fetchers.Patch(
    `${ENDPOINT}/game/internal/start/${gameId}`,
    {
      token: session?.user.accessToken,
    },
  )

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}

export const endGame = async (gameId: string) => {
  const session = await getSession()

  const res = await fetchers.Patch(`${ENDPOINT}/game/internal/end/${gameId}`, {
    token: session?.user.accessToken,
  })

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}

export const timeoutBossGame = async (gameId: string) => {
  const session = await getSession()

  const res = await fetchers.Patch(`${ENDPOINT}/game/internal/attack-timeout`, {
    data: { gameId },
    token: session?.user.accessToken,
  })

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}
