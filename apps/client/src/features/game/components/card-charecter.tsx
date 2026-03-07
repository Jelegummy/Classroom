import Image from 'next/image'
import { CardCharacterProps } from '../types'

export default function CardCharacter({
  characters,
  selectedId,
  onSelect,
}: CardCharacterProps) {
  return (
    <div className="flex h-full w-full items-start justify-center overflow-y-auto bg-transparent p-1 lg:rounded-r-xl lg:p-6">
      <div className="flex w-full flex-col gap-1.5 pb-10 lg:max-w-sm lg:gap-4 lg:pb-20">
        <div className="flex justify-center lg:justify-start">
          <p className="text-md font-bold text-gray-800 lg:text-lg">
            เลือกตัวละคร
          </p>
        </div>
        {characters?.map(character => (
          <div
            key={character.id}
            onClick={() => onSelect(character.id)}
            className={`relative cursor-pointer rounded-lg border-2 bg-white p-1 shadow-lg transition-all hover:scale-105 lg:rounded-2xl lg:border-4 lg:p-4 lg:shadow-lg ${
              character.id === selectedId
                ? 'border-blue-500 ring-1 ring-blue-300 lg:ring-2'
                : 'border-transparent'
            }`}
          >
            <div className="flex aspect-square w-full items-center justify-center overflow-hidden">
              <Image
                src={character.imageUrl || '/catIcon.jpg'}
                alt={character.bossName}
                width={100}
                height={100}
                className="h-32 w-32 object-contain drop-shadow-lg lg:h-full lg:w-full lg:drop-shadow-2xl"
              />
            </div>

            <div className="mt-0.5 truncate text-center text-sm font-bold text-gray-700 lg:mt-2 lg:text-base">
              {character.bossName}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
