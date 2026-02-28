import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  getGameSession,
  attackBoss,
  startGame,
  endGame,
  timeoutBossGame,
} from '@/services/game-session'
import { getAllItems, buyItems } from '@/services/Items'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import CharacterScene from '../../../features/game/components/character-scene'

interface Item {
  id: string
  name: string
  description?: string
  price: number
  effectValue?: number
  type: 'ATTACK_BOOST' | 'TIME_EXTEND'
}

interface Game {
  id: string
  name: string
  damageBoost?: number
  timeLimit?: number
  isActive: boolean
  maxHpBoss?: number
  status: 'WAITING' | 'ONGOING' | 'FINISHED'
  character?: {
    timeLimit: number
    imageUrl: string
    modelUrl: string
    bossName: string
    pointBoss: number
  }
  classrooms?: Array<{
    id: string
    currentHp: number
    attendances?: Array<{
      id: string
      damageDealt: number
      user: {
        id: string
        firstName: string
        lastName: string
        points: number
        inventory: Array<{
          amount: number
          item: Item
        }>
      }
    }>
  }>
}

export default function GameId() {
  const router = useRouter()
  const gameId = router.query.id as string
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const [isGameOver, setIsGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isAttacking, setIsAttacking] = useState(false)

  const { data: game, isLoading } = useQuery<Game | undefined>({
    queryKey: ['getGameSession', gameId],
    queryFn: () => getGameSession(gameId),
    enabled: !!gameId,
    refetchInterval: !isGameOver ? 1000 : false,
  })

  const isStarted = game?.status === 'ONGOING'

  const { data: shopItems } = useQuery({
    queryKey: ['getAllItems'],
    queryFn: () => getAllItems(),
  })

  const endGameMutation = useMutation({
    mutationFn: () => endGame(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getGameSession', gameId] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'เกิดข้อผิดพลาด')
    },
  })

  const timeoutMutation = useMutation({
    mutationFn: () => timeoutBossGame(gameId),
    onSuccess: () => {
      endGameMutation.mutate()
    },
    onError: (err: any) => {
      console.error('Timeout error:', err)
      endGameMutation.mutate()
    },
  })

  useEffect(() => {
    if (game?.timeLimit && timeLeft === 0 && !isStarted) {
      setTimeLeft(game.timeLimit)
    }
  }, [game, isStarted])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isStarted && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (timeLeft === 0 && isStarted && !isGameOver) {
      setIsGameOver(true)
      console.log('Time is up! Distributing points...')
      timeoutMutation.mutate()
    }
    return () => clearInterval(timer)
  }, [isStarted, timeLeft, isGameOver, gameId])

  const activeSession = game?.classrooms?.[0]
  const boss = game?.character
  const attendances = activeSession?.attendances || []

  const currentUserData = useMemo(() => {
    return attendances.find(att => att.user.id === session?.user?.id)
  }, [attendances, session])

  const currentDamage = useMemo(() => {
    const baseDamage = game?.damageBoost || 1
    if (!currentUserData) return baseDamage

    const itemBonus = currentUserData.user.inventory.reduce((sum, inv) => {
      if (inv.item.type === 'ATTACK_BOOST') {
        return sum + (inv.item.effectValue ?? 0) * inv.amount
      }
      return sum
    }, 0)

    return baseDamage + itemBonus
  }, [currentUserData, game?.damageBoost])

  const attackMutation = useMutation({
    mutationFn: (damage: number) => attackBoss(gameId, damage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getGameSession', gameId] })
    },
  })

  const buyItemMutation = useMutation({
    mutationFn: (item: Item) =>
      buyItems({
        userId: session!.user.id,
        itemId: item.id,
        amount: 1,
      }),
    onSuccess: () => {
      toast.success('ซื้อไอเทมสำเร็จ!')
      queryClient.invalidateQueries({ queryKey: ['getGameSession', gameId] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'เกิดข้อผิดพลาด')
    },
  })

  const startGameMutation = useMutation({
    mutationFn: () => startGame(gameId),
    onSuccess: () => {
      toast.success('เริ่มเกมแล้ว!')
    },
    onError: (err: any) => {
      toast.error(err.message || 'เกิดข้อผิดพลาด')
    },
  })

  const handleStartGame = () => {
    if (attendances.length === 0) {
      toast.error('รอนักเรียนเข้าห้องก่อนนะอาจารย์!')
      return
    }
    startGameMutation.mutate()
  }

  const handleAttack = () => {
    if (!isStarted || timeLeft <= 0) return
    if (!activeSession || activeSession.currentHp <= 0) return

    setIsAttacking(true)
    setTimeout(() => setIsAttacking(false), 100)
    attackMutation.mutate(currentDamage)
  }

  const checkIsOwned = (itemId: string) => {
    return (
      currentUserData?.user.inventory.some(inv => inv.item.id === itemId) ??
      false
    )
  }

  const handleBuyItem = (item: Item) => {
    if (!session?.user?.id) return
    if (!currentUserData) {
      toast.error('คุณยังไม่ได้เข้าร่วมห้องเรียนนี้')
      return
    }

    if (checkIsOwned(item.id)) {
      toast.error('คุณมีไอเทมนี้อยู่แล้ว!')
      return
    }

    if (currentUserData.user.points < item.price) {
      toast.error('แต้มไม่พอจ้า!')
      return
    }
    buyItemMutation.mutate(item)
  }

  if (isLoading || !game)
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Loading...
      </div>
    )

  const maxHp = game?.maxHpBoss || 1
  const currentHp = activeSession?.currentHp || 0
  const hpPercentage = Math.max(0, (currentHp / maxHp) * 100)
  const sortedAttendances = [...attendances].sort(
    (a, b) => b.damageDealt - a.damageDealt,
  )

  const totalDamage = sortedAttendances.reduce(
    (sum, att) => sum + att.damageDealt,
    0,
  )
  const isVictory = currentHp <= 0 && totalDamage >= maxHp
  const isDefeat = isGameOver || (currentHp <= 0 && totalDamage < maxHp)

  return (
    <div
      className="relative flex h-[100dvh] w-full select-none flex-col items-center overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-game.png')" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex w-full items-start justify-between p-3 md:p-6">
        <div className="pointer-events-auto flex flex-col drop-shadow-lg">
          <span className="text-xs font-bold uppercase tracking-widest text-white/80 md:text-lg">
            เวลาเหลือ
          </span>
          <div
            className={`text-5xl font-black md:text-7xl ${timeLeft < 10 && isStarted ? 'animate-pulse text-red-500' : 'text-white'}`}
          >
            {timeLeft}
          </div>
        </div>

        <div className="pointer-events-auto w-40 rounded-xl border border-white/30 bg-white/40 p-2 shadow-2xl backdrop-blur-md md:w-80 md:rounded-3xl md:p-5">
          <div className="custom-scrollbar flex max-h-[20vh] flex-col gap-1 overflow-y-auto pr-1 md:max-h-[50vh] md:gap-2 md:pr-2">
            {sortedAttendances.length === 0 ? (
              <div className="p-1 text-center text-[10px] font-bold text-gray-800 md:p-2 md:text-sm">
                กำลังรอนักเรียนเข้าร่วม...
              </div>
            ) : (
              sortedAttendances.map((att, index) => (
                <div
                  key={att.id}
                  className="flex justify-between rounded bg-white/80 p-1 text-[10px] md:p-2 md:text-sm"
                >
                  <span className="truncate pr-1">
                    {index + 1}. {att.user.firstName}
                  </span>
                  <span className="font-bold text-red-600">
                    {att.damageDealt.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="z-0 flex min-h-0 w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 pt-24 md:pt-0">
        <h1 className="mb-1 text-2xl font-black text-white drop-shadow-md md:mb-2 md:text-4xl">
          {boss?.bossName}
        </h1>

        <div className="relative mb-2 h-6 w-full max-w-[250px] overflow-hidden rounded-full border-2 border-black bg-gray-900 md:mb-6 md:h-8 md:max-w-2xl md:border-4">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300"
            style={{ width: `${hpPercentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white md:text-sm">
            {currentHp.toLocaleString()} / {maxHp.toLocaleString()}
          </div>
        </div>

        <div
          onClick={handleAttack}
          className={`relative h-[350px] w-full transition-all ${isStarted && currentHp > 0 ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-80 grayscale'} ${isAttacking ? 'brightness-150' : ''}`}
        >
          <CharacterScene url={boss?.modelUrl || ''} />

          {isAttacking && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl md:text-6xl">
              💥
            </div>
          )}
        </div>
      </div>

      {session?.user.role === 'STUDENT' && (
        <div className="animate-slide-up z-10 w-full shrink-0 rounded-t-2xl border-t border-white/20 bg-black/80 p-3 pb-4 backdrop-blur-md md:p-4">
          <div className="mb-2 flex flex-col justify-between px-2 text-white md:flex-row md:items-center md:px-4">
            <div className="flex w-full justify-between gap-4 md:w-auto md:justify-start md:gap-6">
              <div>
                <span className="text-[10px] uppercase text-gray-400 md:text-sm">
                  เงินของคุณ
                </span>
                <div className="text-lg font-bold text-yellow-400 md:text-2xl">
                  💰 {currentUserData?.user.points?.toLocaleString() || 0}
                </div>
              </div>
              <div className="text-right md:text-left">
                <span className="text-[10px] uppercase text-gray-400 md:text-sm">
                  ดาเมจต่อครั้ง
                </span>
                <div className="text-lg font-bold text-red-400 transition-all duration-300 md:text-2xl">
                  ⚔️ {currentDamage.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="mt-1 text-center text-[10px] text-gray-300 md:mt-0 md:text-xs">
              กดที่ไอเทมเพื่อซื้อ (จำกัด 1 ชิ้น)
            </div>
          </div>

          <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-1 md:gap-4 md:pb-0">
            {shopItems?.map((item: any) => {
              const isOwned = checkIsOwned(item.id)

              return (
                <button
                  key={item.id}
                  disabled={isOwned}
                  onClick={() => handleBuyItem(item)}
                  className={`group relative flex h-24 w-20 flex-shrink-0 flex-col items-center rounded-lg border p-1 transition-all md:h-36 md:w-28 md:rounded-xl md:p-2 ${
                    isOwned
                      ? 'cursor-not-allowed border-green-500 bg-green-900/40 opacity-90'
                      : 'cursor-pointer border-white/20 bg-white/10 hover:scale-105 hover:bg-white/20'
                  } `}
                >
                  <Image
                    src={item.imageUrl || '/catIcon.jpg'}
                    alt={item.name}
                    width={100}
                    height={100}
                    className={`mb-1 h-8 w-8 object-contain drop-shadow-md md:h-12 md:w-12 ${isOwned ? 'grayscale-[0.2]' : ''}`}
                  />
                  <div className="line-clamp-1 text-[10px] font-bold text-white md:text-xs">
                    {item.name}
                  </div>
                  <div className="text-[8px] text-green-300 md:text-[10px]">
                    +{item.effectValue} ATK
                  </div>

                  <div
                    className={`mt-auto w-full rounded px-1 py-0.5 text-[8px] font-bold shadow-sm md:mt-2 md:px-2 md:text-xs ${isOwned ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'} `}
                  >
                    {isOwned ? 'ใช้งานอยู่' : `${item.price} 💰`}
                  </div>

                  {isOwned && (
                    <div className="absolute right-1 top-1 text-[8px] text-green-400 md:right-2 md:top-2 md:text-xs">
                      ✔
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {(session?.user.role === 'TEACHER' || session?.user.role === 'ADMIN') &&
        !isStarted &&
        !isGameOver &&
        currentHp > 0 && (
          <div className="absolute bottom-8 left-1/2 z-50 flex w-[90%] -translate-x-1/2 flex-col items-center md:bottom-10 md:left-10 md:w-auto md:translate-x-0 md:items-start">
            {attendances.length === 0 && (
              <div className="mb-2 w-max rounded bg-black/80 px-3 py-2 text-xs text-white backdrop-blur-sm">
                รอให้นักเรียนเข้าห้องก่อนนะครับอาจารย์
              </div>
            )}
            <button
              onClick={handleStartGame}
              disabled={attendances.length === 0}
              className={`w-full rounded-full py-3 text-xl font-black text-white shadow-xl transition-all md:w-auto md:px-8 md:py-4 md:text-2xl ${
                attendances.length > 0
                  ? 'animate-pulse bg-blue-600 hover:scale-105 hover:bg-blue-500'
                  : 'cursor-not-allowed bg-gray-600 opacity-50'
              }`}
            >
              เริ่มการต่อสู้
            </button>
          </div>
        )}

      {isVictory && !isDefeat && (
        <div className="animate-in fade-in absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 p-4 text-center backdrop-blur-md duration-500">
          <h2 className="animate-bounce text-5xl font-black text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.6)] md:text-8xl">
            VICTORY!
          </h2>
          <p className="mt-4 text-xl font-bold text-white md:text-2xl">
            ภารกิจสำเร็จ!
          </p>

          <Link href={`/session/game/leader/${game.id}`}>
            <button className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-all hover:scale-105 hover:bg-gray-200 md:px-8 md:text-base">
              สรุปผลคะแนน
            </button>
          </Link>
        </div>
      )}

      {isDefeat && (
        <div className="animate-in fade-in absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 text-center backdrop-blur-md duration-500">
          <h2 className="text-5xl font-black text-red-600 drop-shadow-[0_0_25px_rgba(220,38,38,0.6)] md:text-8xl">
            DEFEAT
          </h2>
          <p className="mt-4 text-xl font-bold text-white md:text-2xl">
            หมดเวลาแล้ว! บอสยังไม่ตาย
          </p>

          <Link href={`/session/game/leader/${game.id}`}>
            <button className="mt-8 rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-red-500 md:px-8 md:text-base">
              สรุปผลคะแนน
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
