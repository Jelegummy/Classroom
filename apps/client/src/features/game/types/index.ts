import type { Character } from '@/services/charecter/types'

export type CardCharacterProps = {
  characters: Character[]
  selectedId: string
  onSelect: (id: string) => void
}

export type CardGameProps = {
  classroomId: string
  characterId: string
}

export type DeleteGameProps = {
  id: string
  name: string
}
