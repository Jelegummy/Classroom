import NavbarLeader from '@/components/Navbar-Leader'
import { getGameLeaderboard } from '@/services/game-session'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { useRouter } from 'next/router'
// import Image from 'next/image'

export default function Leaderboard() {
  const router = useRouter()
  const gameId = router.query.id as string

  const { data: gameData, isLoading } = useQuery({
    queryKey: ['gameLeaderboard', gameId],
    queryFn: () => getGameLeaderboard(gameId),
    enabled: !!gameId,
    refetchOnWindowFocus: false,
    refetchInterval: 1000,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  const boss = gameData?.character
  const players = gameData?.leaderboard || []

  const firstPlace = players[0]
  const secondPlace = players[1]
  const thirdPlace = players[2]
  const otherPlayers = players.slice(3)

  const bossInfo = {
    name: boss?.bossName || 'ไม่ทราบชื่อ',
    imageUrl: boss?.imageUrl || '/boss.png',
    hp: boss?.maxHp || 0,
    pointBoss: boss?.pointBoss || 0,
    duration: gameData?.games.timeLimit
      ? `${gameData.games.timeLimit} วินาที`
      : 'ไม่จำกัดเวลา',
    participants: players.length,
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
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${secondPlace.user.firstName || ''} ${secondPlace.user.lastName || ''}`.trim() ||
                        'User',
                    )}&background=random`}
                    alt="Profile"
                    className="mb-3 h-20 w-20 overflow-hidden rounded-full border-4 border-yellow-400 object-cover shadow-sm"
                  />
                  <div className="text-center">
                    <p className="line-clamp-1 font-bold text-gray-800">
                      {secondPlace.user.firstName} {secondPlace.user.lastName}
                    </p>
                    <p className="text-lg font-bold text-blue-500">
                      ได้รับ {secondPlace.scoreEarned} พอยต์
                    </p>
                  </div>
                </div>
              )}

              {firstPlace && (
                <div className="relative z-10 flex h-60 w-56 -translate-y-4 flex-col items-center justify-center rounded-2xl border-2 border-yellow-300 bg-yellow-50 p-4 shadow-xl">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${firstPlace.user.firstName || ''} ${firstPlace.user.lastName || ''}`.trim() ||
                        'User',
                    )}&background=random`}
                    alt="Profile"
                    className="mb-3 h-20 w-20 overflow-hidden rounded-full border-4 border-yellow-400 object-cover shadow-sm"
                  />
                  <div className="text-center">
                    <p className="line-clamp-1 text-lg font-bold text-gray-900">
                      {firstPlace.user.firstName} {firstPlace.user.lastName}
                    </p>
                    <p className="text-xl font-black text-yellow-600">
                      ได้รับ {firstPlace.scoreEarned} พอยต์
                    </p>
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
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${thirdPlace.user.firstName || ''} ${thirdPlace.user.lastName || ''}`.trim() ||
                        'User',
                    )}&background=random`}
                    alt="Profile"
                    className="mb-3 h-20 w-20 overflow-hidden rounded-full border-4 border-yellow-400 object-cover shadow-sm"
                  />
                  <div className="text-center">
                    <p className="line-clamp-1 font-bold text-gray-800">
                      {thirdPlace.user.firstName} {thirdPlace.user.lastName}
                    </p>
                    <p className="text-lg font-bold text-blue-500">
                      ได้รับ {thirdPlace.scoreEarned} พอยต์
                    </p>
                  </div>
                </div>
              )}
            </div>
            {otherPlayers.length === 0 && (
              <div className="hidden">
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
                        </div>
                      </div>
                      <div className="font-bold text-blue-500">
                        {player.scoreEarned.toLocaleString()} พอยต์
                      </div>
                    </div>
                  ))}

                  <div className="hidden py-4 text-center text-gray-400">
                    ไม่มีผู้เล่นอื่น
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 xl:col-span-3">
            <div className="flex flex-col gap-4">
              <div className="flex aspect-square items-center justify-center rounded-2xl bg-white p-6 shadow-md">
                <div className="relative h-full w-full">
                  <div className="flex h-full w-full items-center justify-center text-6xl">
                    <Image src={bossInfo.imageUrl} alt="Boss" fill />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-sm shadow-md">
                <div className="flex justify-between border-b border-gray-100 py-3">
                  <span className="font-bold text-gray-600">เลือดบอส</span>
                  <span className="font-bold text-gray-800">
                    {bossInfo.hp} HP
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-3">
                  <span className="font-bold text-gray-600">
                    จำนวนพ้อยต์ของบอส
                  </span>
                  <span className="font-bold text-gray-800">
                    {bossInfo.pointBoss} พอยต์
                  </span>
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
