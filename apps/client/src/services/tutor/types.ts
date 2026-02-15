export type CreateTutorArgs = {
    botLink?: string
    startTime?: Date
    dataContent?: string
    discordChannelId?: string
    classroomId: string
}

export type Tutor = {
    id: string
    topic: string
    summary: string
    botLink?: string
    startTime?: Date
    dataContent?: string
    discordChannelId?: string
    classroomId: string
}