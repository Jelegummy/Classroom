export type CreateGameArgs = {
  name: string
  imageUrl?: string
  description?: string
  isActive?: boolean
  classroomId: string
  characterId: string
  timeLimit?: number
  damageBoost?: number
}

export type UpdateGameArgs = {
  id: string
  name: string
  imageUrl?: string
  description?: string
  isActive?: boolean
}

export type Game = {
  id: string
  name: string
  imageUrl?: string
  description?: string
  isActive: boolean
  classroomId: string
  characterId: string
  createdAt: string
  updatedAt: string
}
