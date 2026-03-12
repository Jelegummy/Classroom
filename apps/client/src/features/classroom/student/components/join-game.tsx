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

  if (!game || game.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-400">
          <Gamepad2 size={48} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          ยังไม่มีการเล่นเกมในขณะนี้
        </h3>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          ยังไม่มีการกำหนดการเล่นเกมสำหรับห้องเรียนนี้
          โปรดตรวจสอบอีกครั้งในภายหลัง
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {game?.map(game => (
            <div
              key={game.id}
              className="group relative w-full max-w-[350px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Gamepad2 />
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
