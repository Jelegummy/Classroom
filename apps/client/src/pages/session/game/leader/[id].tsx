import NavbarLeader from '@/components/Navbar-Leader'
import { getGameLeaderboard } from '@/services/game-session'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { useRouter } from 'next/router'

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

      <main className="mx-auto mt-6 max-w-7xl p-4 md:mt-10 md:p-6">
        <div className="mb-4 text-center md:mb-8">
          <h1 className="text-3xl font-bold text-blue-500 md:text-5xl">
            เสร็จสิ้น
          </h1>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:mt-20 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="mb-8 flex items-end justify-center gap-2 md:gap-4">
              {secondPlace && (
                <div className="relative flex h-36 w-24 flex-col items-center justify-center rounded-xl bg-white p-2 shadow-md md:h-48 md:w-48 md:rounded-2xl md:p-4">
                  <div className="absolute right-1 top-1 text-orange-300 md:right-3 md:top-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 md:h-6 md:w-6"
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
                    className="mb-1 h-10 w-10 overflow-hidden rounded-full border-2 border-yellow-400 object-cover shadow-sm md:mb-3 md:h-20 md:w-20 md:border-4"
                  />
                  <div className="w-full px-1 text-center">
                    <p className="line-clamp-1 text-[10px] font-bold text-gray-800 md:text-base">
                      {secondPlace.user.firstName} {secondPlace.user.lastName}
                    </p>
                    <p className="text-[9px] font-bold text-blue-500 md:text-lg">
                      {secondPlace.scoreEarned} พอยต์
                    </p>
                  </div>
                </div>
              )}

              {firstPlace && (
                <div className="relative z-10 flex h-44 w-28 -translate-y-2 flex-col items-center justify-center rounded-xl border-2 border-yellow-300 bg-yellow-50 p-2 shadow-xl md:h-60 md:w-56 md:-translate-y-4 md:rounded-2xl md:p-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${firstPlace.user.firstName || ''} ${firstPlace.user.lastName || ''}`.trim() ||
                        'User',
                    )}&background=random`}
                    alt="Profile"
                    className="mb-1 h-14 w-14 overflow-hidden rounded-full border-[3px] border-yellow-400 object-cover shadow-sm md:mb-3 md:h-24 md:w-24 md:border-4"
                  />
                  <div className="w-full px-1 text-center">
                    <p className="line-clamp-1 text-xs font-bold text-gray-900 md:text-lg">
                      {firstPlace.user.firstName} {firstPlace.user.lastName}
                    </p>
                    <p className="text-[10px] font-black text-yellow-600 md:text-xl">
                      {firstPlace.scoreEarned} พอยต์
                    </p>
                  </div>
                </div>
              )}

              {thirdPlace && (
                <div className="relative flex h-36 w-24 flex-col items-center justify-center rounded-xl bg-white p-2 shadow-md md:h-48 md:w-48 md:rounded-2xl md:p-4">
                  <div className="absolute right-1 top-1 text-orange-700/50 md:right-3 md:top-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 md:h-6 md:w-6"
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
                    className="mb-1 h-10 w-10 overflow-hidden rounded-full border-2 border-yellow-400 object-cover shadow-sm md:mb-3 md:h-20 md:w-20 md:border-4"
                  />
                  <div className="w-full px-1 text-center">
                    <p className="line-clamp-1 text-[10px] font-bold text-gray-800 md:text-base">
                      {thirdPlace.user.firstName} {thirdPlace.user.lastName}
                    </p>
                    <p className="text-[9px] font-bold text-blue-500 md:text-lg">
                      {thirdPlace.scoreEarned} พอยต์
                    </p>
                  </div>
                </div>
              )}
            </div>

            {otherPlayers.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm md:p-4">
                {otherPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-2 hover:bg-gray-50 md:p-3"
                  >
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-500 md:h-8 md:w-8 md:text-sm">
                        {index + 4}
                      </div>
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          player.user.firstName || 'User',
                        )}&background=random`}
                        alt="Profile"
                        className="h-8 w-8 overflow-hidden rounded-full object-cover md:h-10 md:w-10"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-800 md:text-base">
                          {player.user.firstName}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-blue-500 md:text-base">
                      {player.scoreEarned.toLocaleString()} พอยต์
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-gray-400 md:text-base">
                {players.length > 0
                  ? 'ไม่มีผู้เล่นอันดับอื่นเพิ่มเติม'
                  : 'ยังไม่มีผู้เข้าร่วม'}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 xl:col-span-3">
            <div className="flex flex-col gap-4">
              <div className="mx-auto flex aspect-square w-48 items-center justify-center rounded-2xl bg-white p-4 shadow-md md:w-full md:p-6">
                <div className="relative h-full w-full">
                  <Image
                    src={bossInfo.imageUrl}
                    alt="Boss"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 text-xs shadow-md md:text-sm">
                <div className="flex justify-between border-b border-gray-100 py-2 md:py-3">
                  <span className="font-bold text-gray-600">เลือดบอส</span>
                  <span className="font-bold text-gray-800">
                    {bossInfo.hp} HP
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-2 md:py-3">
                  <span className="font-bold text-gray-600">
                    จำนวนพ้อยต์ของบอส
                  </span>
                  <span className="font-bold text-gray-800">
                    {bossInfo.pointBoss} พอยต์
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 py-2 md:py-3">
                  <span className="font-bold text-gray-600">ระยะเวลา</span>
                  <span className="font-bold text-gray-800">
                    {bossInfo.duration}
                  </span>
                </div>
                <div className="flex justify-between py-2 md:py-3">
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
