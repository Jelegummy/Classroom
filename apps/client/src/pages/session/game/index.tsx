import CardCharacter from './components/card-charecter'
import CardGame from './components/card-game'
import CharacterScene from './components/character-scene'
import { useRouter } from 'next/router'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllCharacters } from '@/services/charecter'
import NavbarSession from '@/components/Navbar-Session'

export default function GameSession() {
  const router = useRouter()
  const { classroomId } = router.query

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')

  const { data: characters } = useQuery({
    queryKey: ['charecters'],
    queryFn: () => getAllCharacters(),
    refetchOnWindowFocus: false,
    refetchInterval: 1000,
  })

  const selectedModelUrl = useMemo(() => {
    const character = characters?.find(c => c.id === selectedCharacterId)
    return character?.modelUrl || ''
  }, [characters, selectedCharacterId])

  return (
    <div
      className="flex h-screen w-full flex-col overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg-game.png')" }}
    >
      <NavbarSession />

      <div className="flex flex-1 flex-row overflow-hidden">
        <div className="z-20 h-full shadow-xl">
          <CardCharacter
            characters={characters || []}
            selectedId={selectedCharacterId}
            onSelect={setSelectedCharacterId}
          />
        </div>

        <div className="relative flex-auto bg-black/10 pr-[200px]">
          <CharacterScene url={selectedModelUrl} />

          {!selectedCharacterId && (
            <div className="pointer-events-none absolute inset-x-0 top-10 z-10 flex justify-center pr-[200px]">
              <div className="w-fit border border-white/50 bg-white/40 p-1 shadow-lg backdrop-blur-sm">
                <div className="bg-white px-6 py-2 text-xl font-bold text-black">
                  เลือกตัวละครเพื่อเริ่มต้น
                </div>
              </div>
            </div>
          )}
        </div>

        <CardGame
          classroomId={classroomId as string}
          characterId={selectedCharacterId}
        />
      </div>
    </div>
  )
}
