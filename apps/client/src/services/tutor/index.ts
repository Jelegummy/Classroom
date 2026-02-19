import { ENDPOINT, fetchers, HttpStatus } from '@/utils'
import { getSession } from 'next-auth/react'
import { CreateTutorArgs, Tutor, TutorContent, TutorContentUser } from './types'

export const createTutor = async (args: CreateTutorArgs) => {
  const session = await getSession()

  const res = await fetchers.Post<CreateTutorArgs>(
    `${ENDPOINT}/tutor/internal/create`,
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

export const getAllTutors = async (args: { classroomId?: string }) => {
  const session = await getSession()

  const queryString = args.classroomId ? `?classroomId=${args.classroomId}` : ''
  const res = await fetchers.Get<Tutor[]>(
    `${ENDPOINT}/tutor/internal/all${queryString}`,
    {
      token: session?.user.accessToken,
    },
  )

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}

export const getTutorById = async (id: string) => {
  const session = await getSession()

  const res = await fetchers.Get<Tutor>(`${ENDPOINT}/tutor/internal/${id}`, {
    token: session?.user.accessToken,
  })

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}

export const getTutorContentById = async (id: string) => {
  const session = await getSession()

  const res = await fetchers.Get<TutorContent[]>(
    `${ENDPOINT}/tutor/internal/content/${id}`,
    {
      token: session?.user.accessToken,
    },
  )

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}

export const getTutorContentUserById = async (id: string) => {
  const session = await getSession()

  const res = await fetchers.Get<TutorContentUser[]>(
    `${ENDPOINT}/tutor/internal/contentUser/${id}`,
    {
      token: session?.user.accessToken,
    },
  )

  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
}
