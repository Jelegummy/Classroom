export type RankingProps = {
  classroomId: string
  studentIds: string[]
  points: number[]
  names: string[]
  roles: string[]
}

export type SelectedStudent = {
  id: string
  name: string
  point: number
} | null
