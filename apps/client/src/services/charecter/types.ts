export type CreateCharacter = {
    bossName: string
    maxHp: number
    timeLimit: number
    description?: string
    modelUrl?: string
    imageUrl?: string
}

export type Character = {
    id: string
    bossName: string
    maxHp: number
    timeLimit: number
    description?: string
    modelUrl?: string
    imageUrl?: string
    createdAt: string
    updatedAt: string
}