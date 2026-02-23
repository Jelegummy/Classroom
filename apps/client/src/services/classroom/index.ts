import { ENDPOINT, fetchers, HttpStatus } from '@/utils'
import {
  Classroom,
  CreateClassroom,
  JoinClassroomArgs,
  RewardDataResponse,
  UpdateClassroom,
} from './types'
import { getSession } from 'next-auth/react'

export const CreateClassRoom = async (args: CreateClassroom) => {
  const session = await getSession()

  const res = await fetchers.Post<{ accessToken: string }>(
    `${ENDPOINT}/classroom/internal/create`,
    {
      data: args,
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }
} // use for creating classroom

export const JoinClassroom = async (args: JoinClassroomArgs) => {
  const session = await getSession()

  const res = await fetchers.Post<Classroom>(
    `${ENDPOINT}/classroom/internal/join/code`,
    {
      data: args,
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
} // use for joining classroom (student)

export const UpdateClassRoom = async (args: UpdateClassroom) => {
  const session = await getSession()

  const res = await fetchers.Patch(`${ENDPOINT}/classroom/internal/update`, {
    data: args,
    token: session?.user.accessToken,
  })
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }
} // use for updating classroom

export const getClassroom = async (id: string) => {
  const session = await getSession()
  const res = await fetchers.Get<Classroom>(
    `${ENDPOINT}/classroom/internal/classroom/${id}`,
    {
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
} // use for getting classroom by id

export const getAllClassrooms = async () => {
  const session = await getSession()
  const res = await fetchers.Get<Classroom[]>(
    `${ENDPOINT}/classroom/internal/all`,
    {
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
} // use for getting all classrooms

export const deleteClassroom = async (id: string) => {
  const session = await getSession()
  const res = await fetchers.Delete(
    `${ENDPOINT}/classroom/internal/delete/${id}`,
    {
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }
} // use for deleting classroom

// export const rewardOwner = async (classroomId: string) => {
//   const session = await getSession()
//   const res = await fetchers.Patch(
//     `${ENDPOINT}/classroom/internal/reward-owner/${classroomId}`,
//     {
//       token: session?.user.accessToken,
//     },
//   )
//   if (res.statusCode >= HttpStatus.BAD_REQUEST) {
//     throw new Error(res.message)
//   }

//   return res.data
// } // use for rewarding owner of the classroom -- IGNORE --

export const getRewards = async (classroomId: string) => {
  const session = await getSession()
  const res = await fetchers.Get<RewardDataResponse>(
    `${ENDPOINT}/classroom/internal/rewards/${classroomId}`,
    {
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
} // use for getting rewards of the classroom

export const rewardStudent = async (classroomId: string, userId: string, pointsToAdd: number) => {
  const session = await getSession()
  const res = await fetchers.Patch(
    `${ENDPOINT}/classroom/internal/reward-student/${classroomId}/${userId}`,
    {
      data: { pointsToAdd },
      token: session?.user.accessToken,
    },
  )
  if (res.statusCode >= HttpStatus.BAD_REQUEST) {
    throw new Error(res.message)
  }

  return res.data
} // use for rewarding student in the classroom
