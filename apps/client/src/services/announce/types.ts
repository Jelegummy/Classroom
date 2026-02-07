export type Announce = {
  id: string
  title: string
  message: string
  filePdf?: string
  createdAt: string
  updatedAt: string
}

export type CreateAnnounceArgs = {
  title: string
  message: string
  filePdf?: string
  classroomId: string
}

export type UpdateAnnounceArgs = {
  id: string
  title: string
  message: string
  filePdf?: string
}
