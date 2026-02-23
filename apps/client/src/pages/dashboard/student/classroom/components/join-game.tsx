import { getAllGameSessions, joinGame } from '@/services/game-session'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Gamepad2, Swords, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

interface JoinGameProps {
  classroomId: string
}

export default function JoinGame({ classroomId }: JoinGameProps) {
  const router = useRouter()

  const { data: game } = useQuery({
    queryKey: ['getAllGameSessions', classroomId],
    queryFn: () => getAllGameSessions(),
    select: games => {
      return (
        games?.filter((g: any) =>
          g.classrooms?.some((room: any) => room.classroomId === classroomId),
        ) || []
      )
    },
    refetchOnWindowFocus: false,
    refetchInterval: 1000,
  })

  const joinMutation = useMutation({
    mutationFn: (gameId: string) => joinGame(gameId),
    onSuccess: (data, gameId) => {
      router.push(`/session/game/${gameId}`)
    },
    onError: (error: any) => {
      toast.error('ไม่สามารถเข้าห้องได้: ' + error.message)
    },
  })

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {game?.map(game => (
            <div
              key={game.id}
              className="w-full max-w-[350px] rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="h-fit rounded-lg bg-blue-100 p-2.5">
                    <Gamepad2 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {game.name}
                    </h3>
                    <p className="text-sm text-gray-400">{game.description}</p>
                  </div>
                </div>
                <span
                  className={`rounded px-2 py-1 text-[10px] font-semibold ${game.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                >
                  {game.isActive ? 'กำลังเล่น' : 'ปิดหรือจบแล้ว'}
                </span>
              </div>

              <div className="mb-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>เข้าร่วม</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {/* {game.joinedUsersCount || 0} คน */}
                </span>
              </div>

              <hr className="mb-4 border-gray-100" />
              {!game.isActive ? (
                <Link
                  href={`/session/game/leader/${game.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-300 py-3 font-semibold text-primary transition-all hover:bg-gray-300/80"
                >
                  <Swords className="h-5 w-5" />
                  สรุปผลคะแนน
                </Link>
              ) : (
                <button
                  onClick={() => joinMutation.mutate(game.id)}
                  disabled={
                    joinMutation.isPending && joinMutation.variables === game.id
                  }
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all duration-200 ${
                    joinMutation.isPending && joinMutation.variables === game.id
                      ? 'cursor-not-allowed bg-gray-500'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-105 hover:shadow-lg'
                  }`}
                >
                  <Swords className="h-5 w-5" />
                  {joinMutation.isPending && joinMutation.variables === game.id
                    ? 'กำลังเข้าห้อง...'
                    : 'เข้าร่วม'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
