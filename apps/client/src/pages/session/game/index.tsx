import CardCharacter from '../../../features/game/components/card-charecter'
import CardGame from '../../../features/game/components/card-game'
import CharacterScene from '../../../features/game/components/character-scene'
import { useRouter } from 'next/router'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllCharacters } from '@/services/charecter'
import NavbarSession from '@/components/Navbar-Session'
import CardUser from '../../../features/game/components/card-user'
import Rotation from '@/components/Rotation'

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
    <>
      <Rotation />
      <div
        className="flex h-screen w-full flex-col overflow-hidden bg-cover bg-center bg-no-repeat portrait:hidden"
        style={{ backgroundImage: "url('/bg-game.png')" }}
      >
        <NavbarSession />

        <div className="flex w-full flex-1 flex-row overflow-hidden">
          <div className="z-20 h-full w-44 shrink-0 bg-gray-200/80 shadow-xl backdrop-blur-sm lg:w-72">
            <CardCharacter
              characters={characters || []}
              selectedId={selectedCharacterId}
              onSelect={setSelectedCharacterId}
            />
          </div>

          <div className="relative min-w-0 flex-1 bg-black/10">
            <CharacterScene url={selectedModelUrl} />

            {!selectedCharacterId && (
              <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center lg:top-10">
                <div className="w-fit border border-white/50 bg-white/40 p-1 shadow-lg backdrop-blur-sm">
                  <div className="bg-white px-2 py-1 text-xs font-bold text-black lg:px-6 lg:py-2 lg:text-xl">
                    เลือกตัวละครเพื่อเริ่มต้น
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="z-20 flex h-full w-56 shrink-0 flex-col gap-1 overflow-y-auto bg-white/10 p-1.5 pb-2 lg:w-[400px] lg:gap-4 lg:p-4 lg:pb-6">
            <div className="min-h-[100px] flex-1 overflow-hidden rounded-xl border border-white/50 shadow-xl lg:min-h-[150px] lg:rounded-2xl">
              <CardUser classroomId={classroomId as string} />
            </div>

            <div className="shrink-0">
              <CardGame
                classroomId={classroomId as string}
                characterId={selectedCharacterId}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
