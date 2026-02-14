import NavbarLeader from '@/components/Navbar-Leader'
import { getGameLeaderboard } from '@/services/game-session'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
// import Image from 'next/image'

export default function Leaderboard() {
  const router = useRouter()
  const gameId = router.query.id as string

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['gameLeaderboard', gameId],
    queryFn: () => getGameLeaderboard(gameId),
    enabled: !!gameId,
    refetchOnWindowFocus: false,
  })

  console.log('Game ID:', gameId)
  console.log('API Result:', leaderboard)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  const firstPlace = leaderboard?.[0]
  const secondPlace = leaderboard?.[1]
  const thirdPlace = leaderboard?.[2]
  const otherPlayers = leaderboard?.slice(3) || []

  const bossInfo = {
    imageUrl: '/boss.png',
    hp: 500,
    duration: '100 วินาที',
    participants: leaderboard?.length || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavbarLeader />

      <main className="mx-auto mt-10 max-w-7xl p-6">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-blue-500">เสร็จสิ้น</h1>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="mb-8 flex items-end justify-center gap-4">
              {secondPlace && (
                <div className="relative flex h-48 w-48 flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-md">
                  <div className="absolute right-3 top-3 text-orange-300">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div className="mb-2 h-16 w-16 overflow-hidden rounded-full border-4 border-gray-200">
                    {/* <div className="flex h-full w-full items-center justify-center bg-blue-100 text-xl"></div> */}
                  </div>
                  <div className="text-center">
                    <p className="line-clamp-1 font-bold text-gray-800">
                      {secondPlace.user.firstName}
                    </p>
                    <p className="text-lg font-bold text-blue-500">
                      {secondPlace.damageDealt} ดาเมจ
                    </p>
                    <p className="text-xs text-gray-400">
                      ได้รับ {secondPlace.user.points} พอยต์
                    </p>
                  </div>
                </div>
              )}

              {firstPlace && (
                <div className="relative z-10 flex h-60 w-56 -translate-y-4 flex-col items-center justify-center rounded-2xl border-2 border-yellow-300 bg-yellow-50 p-4 shadow-xl">
                  {/* <div className="absolute -top-6 text-4xl"></div> */}
                  <div className="mb-3 h-20 w-20 overflow-hidden rounded-full border-4 border-yellow-400 shadow-sm">
                    {/* <div className="flex h-full w-full items-center justify-center bg-yellow-200 text-2xl">
                    </div> */}
                  </div>
                  <div className="text-center">
                    <p className="line-clamp-1 text-lg font-bold text-gray-900">
                      {firstPlace.user.firstName}
                    </p>
                    <p className="text-xl font-black text-yellow-600">
                      {firstPlace.damageDealt} ดาเมจ
                    </p>
                    {/* <p className="text-sm text-yellow-500/80">
                      ได้รับ {firstPlace.user.points} พอยต์
                    </p> */}
                  </div>
                </div>
              )}

              {thirdPlace && (
                <div className="relative flex h-48 w-48 flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-md">
                  <div className="absolute right-3 top-3 text-orange-700/50">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <div className="mb-2 h-16 w-16 overflow-hidden rounded-full border-4 border-orange-200">
                    {/* <div className="flex h-full w-full items-center justify-center bg-orange-100 text-xl">
                    </div> */}
                  </div>
                  <div className="text-center">
                    <p className="line-clamp-1 font-bold text-gray-800">
                      {thirdPlace.user.firstName}
                    </p>
                    <p className="text-lg font-bold text-blue-500">
                      {thirdPlace.damageDealt} ดาเมจ
                    </p>
                    <p className="text-xs text-gray-400">
                      ได้รับ {thirdPlace.user.points} พอยต์
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-sm">
              {otherPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-sm font-bold text-gray-500">
                      {index + 4}
                    </div>
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                      <div className="flex h-full w-full items-center justify-center bg-gray-300">
                        👤
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        {player.user.firstName}
                      </p>
                      <p className="text-xs text-gray-400">
                        ได้รับ {player.user.points} พอยต์
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-blue-500">
                    {player.damageDealt.toLocaleString()} ดาเมจ
                  </div>
                </div>
              ))}

              {otherPlayers.length === 0 && (
                <div className="py-4 text-center text-gray-400">
                  ไม่มีผู้เล่นอื่น
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 xl:col-span-3">
            <div className="flex flex-col gap-4">
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-white p-6 shadow-md">
                <div className="relative h-full w-full">
                  {/* <div className="flex h-full w-full items-center justify-center text-6xl opacity-20">
                  </div> */}
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-sm shadow-md">
                <div className="flex justify-between border-b border-gray-100 py-3">
                  <span className="font-bold text-gray-600">เลือดบอส</span>
                  <span className="font-bold text-gray-800">{bossInfo.hp}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-3">
                  <span className="font-bold text-gray-600">ระยะเวลา</span>
                  <span className="font-bold text-gray-800">
                    {bossInfo.duration}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="font-bold text-gray-600">เข้าร่วม</span>
                  <span className="font-bold text-gray-800">
                    {bossInfo.participants} คน
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

//TODO : get info from api and display (info boss, damage, player name, etc.)
