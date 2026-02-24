export type CardCharacterProps = {
  characters: any[]
  selectedId: string
  onSelect: (id: string) => void
}

export type CardGameProps = {
  classroomId: string
  characterId: string
}
