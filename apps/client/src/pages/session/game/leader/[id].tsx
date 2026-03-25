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
      <div className="flex h-screen items-center justify-center bg-slate-900 text-yellow-400">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>
          <p className="animate-pulse text-lg font-bold tracking-widest">
            LOADING...
          </p>
        </div>
      </div>
    )
  }

  const boss = gameData?.games
  const players = gameData?.leaderboard || []

  const firstPlace = players[0]
  const secondPlace = players[1]
  const thirdPlace = players[2]
  const otherPlayers = players.slice(3)

  const totalDamage = players.reduce(
    (sum, p) => sum + Number(p.scoreEarned || 0),
    0,
  )

  const Remaining = Math.max(
    0,
    Number(boss?.character?.pointBoss || 0) - totalDamage,
  )

  const bossInfo = {
    name: boss?.character?.bossName || 'ไม่ทราบชื่อ',
    imageUrl: boss?.character?.imageUrl || '/boss.png',
    hp: boss?.maxHpBoss || 0,
    pointBoss: boss?.character?.pointBoss || 0,
    duration: gameData?.games.timeLimit
      ? `${gameData.games.timeLimit} วินาที`
      : 'ไม่จำกัดเวลา',
    participants: players.length,
    Remaining,
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black font-sans text-white">
      <div className="text-black">
        <NavbarLeader />
      </div>

      <main className="mx-auto mt-5 max-w-7xl p-4 md:mt-5 md:p-6">
        <div className="mb-6 text-center md:mb-12">
          {Remaining === 0 ? (
            <>
              <h1 className="animate-pulse bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-500 bg-clip-text text-4xl font-black uppercase tracking-wider text-transparent drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] md:text-6xl">
                Victory!
              </h1>
              <p className="mt-2 text-sm font-medium tracking-widest text-slate-300 md:text-lg">
                ปราบมอนสเตอร์สำเร็จ! สรุปผลการต่อสู้สุดเดือด
              </p>
            </>
          ) : (
            <>
              <h1 className="bg-gradient-to-r from-red-400 via-red-600 to-red-900 bg-clip-text text-4xl font-black uppercase tracking-wider text-transparent drop-shadow-[0_0_15px_rgba(220,38,38,0.5)] md:text-6xl">
                Defeat
              </h1>
              <p className="mt-2 text-sm font-medium tracking-widest text-slate-300 md:text-lg">
                บอสยังคงยืนหยัดได้... สรุปผลการต่อสู้
              </p>
            </>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 md:mt-16 lg:grid-cols-12 lg:gap-10">
          <div className="order-2 lg:order-1 lg:col-span-8 xl:col-span-8">
            <div className="mb-12 flex items-end justify-center gap-2 px-2 md:gap-6">
              {secondPlace && (
                <div className="relative flex h-48 w-28 flex-col items-center justify-end rounded-t-xl border-t-2 border-slate-300 bg-gradient-to-t from-slate-800 to-slate-700/50 p-2 shadow-[0_0_20px_rgba(148,163,184,0.2)] md:h-64 md:w-44 md:p-4">
                  <div className="absolute -top-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 font-black text-slate-800 shadow-lg md:-top-8 md:h-14 md:w-14 md:text-xl">
                    2
                  </div>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${secondPlace.user.firstName || ''} ${secondPlace.user.lastName || ''}`.trim() ||
                        'User',
                    )}&background=random`}
                    alt="Profile"
                    className="mb-2 h-12 w-12 overflow-hidden rounded-full border-2 border-slate-300 object-cover shadow-md md:mb-3 md:h-20 md:w-20 md:border-4"
                  />
                  <div className="w-full text-center">
                    <p className="line-clamp-1 text-[11px] font-bold text-slate-100 md:text-base">
                      {secondPlace.user.firstName}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-slate-300 md:text-sm">
                      ดาเมจ: {secondPlace.damageDealt || 0}
                    </p>
                    <div className="mt-1 rounded bg-slate-800/80 px-1 py-1 text-[10px] font-black text-slate-200 md:text-sm">
                      {secondPlace.scoreEarned} พอยต์
                    </div>
                  </div>
                </div>
              )}

              {firstPlace && (
                <div className="relative z-10 flex h-60 w-32 flex-col items-center justify-end rounded-t-2xl border-t-4 border-yellow-400 bg-gradient-to-t from-yellow-900/40 to-yellow-600/20 p-2 shadow-[0_0_30px_rgba(234,179,8,0.4)] md:h-80 md:w-52 md:p-4">
                  <div className="absolute -top-8 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 font-black text-slate-900 shadow-[0_0_20px_rgba(234,179,8,0.6)] md:-top-10 md:h-20 md:w-20 md:text-3xl">
                    👑
                  </div>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${firstPlace.user.firstName || ''} ${firstPlace.user.lastName || ''}`.trim() ||
                        'User',
                    )}&background=random`}
                    alt="Profile"
                    className="mb-2 h-16 w-16 overflow-hidden rounded-full border-4 border-yellow-400 object-cover shadow-lg md:mb-4 md:h-28 md:w-28"
                  />
                  <div className="w-full text-center">
                    <p className="line-clamp-1 text-xs font-black text-yellow-400 md:text-xl">
                      {firstPlace.user.firstName} {firstPlace.user.lastName}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-yellow-200 md:text-sm">
                      ⚔️ ดาเมจ: {firstPlace.damageDealt || 0}
                    </p>
                    <div className="mt-2 rounded-lg bg-yellow-500/20 px-1 py-1.5 text-xs font-black text-yellow-300 md:text-lg">
                      {firstPlace.scoreEarned} พอยต์
                    </div>
                  </div>
                </div>
              )}

              {thirdPlace && (
                <div className="relative flex h-40 w-28 flex-col items-center justify-end rounded-t-xl border-t-2 border-orange-500 bg-gradient-to-t from-slate-800 to-orange-900/30 p-2 shadow-[0_0_20px_rgba(249,115,22,0.15)] md:h-56 md:w-44 md:p-4">
                  <div className="absolute -top-5 flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-black text-slate-900 shadow-lg md:-top-7 md:h-12 md:w-12 md:text-xl">
                    3
                  </div>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${thirdPlace.user.firstName || ''} ${thirdPlace.user.lastName || ''}`.trim() ||
                        'User',
                    )}&background=random`}
                    alt="Profile"
                    className="mb-2 h-10 w-10 overflow-hidden rounded-full border-2 border-orange-500 object-cover shadow-md md:mb-3 md:h-16 md:w-16 md:border-4"
                  />
                  <div className="w-full text-center">
                    <p className="line-clamp-1 text-[11px] font-bold text-slate-100 md:text-base">
                      {thirdPlace.user.firstName}
                    </p>
                    <p className="mt-1 text-[10px] font-bold text-orange-200 md:text-sm">
                      ดาเมจ: {thirdPlace.damageDealt || 0}
                    </p>
                    <div className="mt-1 rounded bg-slate-800/80 px-1 py-1 text-[10px] font-black text-orange-400 md:text-sm">
                      {thirdPlace.scoreEarned} พอยต์
                    </div>
                  </div>
                </div>
              )}
            </div>

            {otherPlayers.length > 0 ? (
              <div className="flex flex-col gap-3 rounded-2xl bg-slate-800/50 p-4 shadow-xl backdrop-blur-sm md:p-6">
                <h3 className="mb-2 text-lg font-bold text-slate-300 md:text-xl">
                  นักรบคนอื่นๆ
                </h3>
                {otherPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/80 p-3 transition-all hover:-translate-y-1 hover:border-slate-500 hover:bg-slate-700 md:p-4"
                  >
                    <div className="flex items-center gap-3 md:gap-5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 font-bold text-slate-400 md:h-10 md:w-10 md:text-lg">
                        {index + 4}
                      </div>
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          player.user.firstName || 'User',
                        )}&background=random`}
                        alt="Profile"
                        className="h-10 w-10 overflow-hidden rounded-full object-cover md:h-12 md:w-12"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-100 md:text-base">
                          {player.user.firstName} {player.user.lastName}
                        </p>
                        <p className="text-xs text-slate-400 md:text-sm">
                          ดาเมจที่ทำได้:{' '}
                          <span className="text-slate-200">
                            {player.damageDealt || 0}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-yellow-400 md:text-lg">
                        {player.scoreEarned.toLocaleString()}{' '}
                        <span className="text-xs text-yellow-600 md:text-sm">
                          พอยต์
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-800/50 p-6 text-center text-slate-400 backdrop-blur-sm">
                {players.length > 0
                  ? 'ไม่มีผู้เล่นอันดับอื่นเพิ่มเติม'
                  : 'ยังไม่มีผู้เข้าร่วมการต่อสู้นี้'}
              </div>
            )}
          </div>
          <div className="order-1 lg:order-2 lg:col-span-4 xl:col-span-4">
            <div className="sticky top-24 flex flex-col gap-6">
              <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-800/60 shadow-2xl backdrop-blur-md">
                {Remaining === 0 ? (
                  <div className="bg-red-900/40 p-3 text-center">
                    <span className="text-sm font-black tracking-widest text-red-400">
                      BOSS DEFEATED
                    </span>
                  </div>
                ) : (
                  <div className="bg-yellow-900/40 p-3 text-center">
                    <span className="text-sm font-black tracking-widest text-yellow-400">
                      BOSS VICTORY
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {Remaining === 0 ? (
                    <div className="relative mx-auto flex aspect-square w-48 items-center justify-center rounded-2xl bg-slate-900/80 p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] md:w-56">
                      <div className="relative h-full w-full opacity-80 grayscale transition-all duration-500 hover:grayscale-0">
                        <Image
                          src={bossInfo.imageUrl}
                          alt="Boss"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="rotate-12 text-5xl font-black text-red-500/70 opacity-50">
                          DEFEATED
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative mx-auto flex aspect-square w-48 items-center justify-center rounded-2xl p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] md:w-56">
                      <div className="relative h-full w-full opacity-80 transition-all duration-500 hover:grayscale-0">
                        <Image
                          src={bossInfo.imageUrl}
                          alt="Boss"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex flex-col gap-3">
                    <h2 className="mb-2 text-center text-xl font-black text-white">
                      {bossInfo.name}
                    </h2>

                    <div className="flex justify-between rounded-lg bg-slate-900/50 p-3 text-sm">
                      <span className="font-semibold text-slate-400">
                        Max HP
                      </span>
                      <span className="font-black text-red-400">
                        {bossInfo.hp.toLocaleString()} HP
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-slate-900/50 p-3 text-sm">
                      <span className="font-semibold text-slate-400">
                        พอยต์คงเหลือ
                      </span>
                      <span className="font-black text-yellow-400">
                        {bossInfo.Remaining.toLocaleString()} พอยต์
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-slate-900/50 p-3 text-sm">
                      <span className="font-semibold text-slate-400">
                        ระยะเวลา
                      </span>
                      <span className="font-black text-slate-200">
                        {bossInfo.duration}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-slate-900/50 p-3 text-sm">
                      <span className="font-semibold text-slate-400">
                        ผู้กล้าที่เข้าร่วม
                      </span>
                      <span className="font-black text-sky-400">
                        {bossInfo.participants} คน
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
