export type CreateClassroom = {
  name: string
  title?: string
  code?: string
}

export type UpdateClassroom = {
  id: string
  name?: string
  title?: string
  hoverImage?: string
}

export type Classroom = {
  id: string
  name: string
  title?: string
  hoverImage?: string
  announce: string
  code: string
  createdAt: string
  updatedAt: string
  users: {
    user: {
      id: string
      firstName: string
      lastName: string
      role: 'TEACHER' | 'STUDENT' | 'ADMIN'
      points: number
    }
    score: number
  }[]
  announces: {
    id: string
    title: string
    content: string
    createdAt: string
    updatedAt: string
  }[]
}

export type JoinClassroomArgs = {
  code: string
}

export type RewardDataResponse = {
  statusCode: number
  data: number
}

export type UserInClassroom = {
  user: {
    id: string
    firstName: string
    lastName: string
  }
}
