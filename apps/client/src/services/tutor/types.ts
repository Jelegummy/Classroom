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
  host: {
    id: string
    firstName: string
    lastName: string
  }
}

export type TutorContent = {
  id: string
  topic: string
  summary: string
  dataContent: {
    roles: {
      main_speaker: string
      active_participants: string[]
      silent_participants: string[]
    }
    transcript: {
      end: number
      text: string
      start: number
      speaker: string
    }[]
    participants: string[]
  }
}

export type TutorContentUser = {
  userId: string
  fullName: string
  scoreEarnedInSession: number
  totalUserPoints: number
}
