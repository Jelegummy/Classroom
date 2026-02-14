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

export type CreateGameResponse = {
  id: string
}

export type UpdateGameArgs = {
  id: string
  name: string
  imageUrl?: string
  description?: string
  isActive?: boolean
}

export interface Attendance {
  id: string
  damageDealt: number
  user: {
    firstName: string
    lastName: string
  }
}

export interface ClassroomSession {
  id: string
  currentHp: number
  classroomId: string
  attendances: Attendance[]
}

interface Item {
  id: string
  name: string
  price: number
  effectValue: number
  imageUrl: string
  type: 'ATTACK_BOOST' | 'TIME_EXTEND'
}

export interface Game {
  id: string
  name: string
  imageUrl?: string
  description?: string
  isActive: boolean
  status: 'WAITING' | 'ONGOING' | 'FINISHED'
  character?: {
    id: string
    bossName: string
    maxHp: number
    timeLimit: number
    imageUrl: string
    modelUrl: string
    pointBoss: number
  }
  classrooms: Array<{
    id: string
    currentHp: number
    attendances?: Array<{
      id: string
      damageDealt: number
      user: {
        id: string
        firstName: string
        lastName: string
        points: number
        inventory: Array<{
          amount: number
          item: Item
        }>
      }
    }>
  }>
}

export type Leader = {
  id: string
  damageDealt: number
  scoreEarned: number
  userName: string
  user: {
    id: string
    firstName: string
    lastName: string
    points: number
  }
}
