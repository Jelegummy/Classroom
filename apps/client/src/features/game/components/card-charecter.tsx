import Image from 'next/image'
import { CardCharacterProps } from '../types'

export default function CardCharacter({
  characters,
  selectedId,
  onSelect,
}: CardCharacterProps) {
  return (
    <div className="flex h-screen w-72 items-start justify-center overflow-y-auto rounded-r-xl bg-gray-200/80 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col gap-4 pb-20">
        <div className="flex">
          <p className="text-lg font-bold">เลือกตัวละคร</p>
        </div>
        {characters?.map(character => (
          <div
            key={character.id}
            onClick={() => onSelect(character.id)}
            className={`relative cursor-pointer rounded-2xl border-4 bg-white p-4 shadow-lg transition-all hover:scale-105 ${
              character.id === selectedId
                ? 'border-blue-500 ring-2 ring-blue-300'
                : 'border-transparent'
            }`}
          >
            <div className="flex aspect-square w-full items-center justify-center overflow-hidden">
              <Image
                src={character.imageUrl || '/catIcon.jpg'}
                // src={'/catIcon.jpg'}
                alt={character.bossName}
                width={100}
                height={100}
                className="h-full w-full object-contain drop-shadow-2xl"
              />
            </div>

            <div className="mt-2 text-center font-bold text-gray-700">
              {character.bossName}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
