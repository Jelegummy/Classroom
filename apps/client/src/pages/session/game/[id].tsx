import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getGameSession, attackBoss } from '@/services/game-session'
import { getAllItems, buyItems } from '@/services/Items'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import CharacterScene from './components/character-scene'

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
  character?: {
    timeLimit: number
    maxHp: number
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

  const [isStarted, setIsStarted] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isAttacking, setIsAttacking] = useState(false)

  const { data: game, isLoading } = useQuery<Game | undefined>({
    queryKey: ['getGameSession', gameId],
    queryFn: () => getGameSession(gameId),
    enabled: !!gameId,
    refetchInterval: isStarted ? 2000 : false,
  })

  const { data: shopItems } = useQuery({
    queryKey: ['getAllItems'],
    queryFn: () => getAllItems(),
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
    } else if (timeLeft === 0 && isStarted) {
      setIsStarted(false)
      setIsGameOver(true)
    }
    return () => clearInterval(timer)
  }, [isStarted, timeLeft])

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
  }, [currentUserData])

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

  const handleStartGame = () => {
    if (attendances.length === 0) {
      toast.error('รอนักเรียนเข้าห้องก่อนนะอาจารย์!')
      return
    }
    setIsStarted(true)
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
      <div className="flex h-screen items-center justify-center text-white">
        Loading...
      </div>
    )

  const maxHp = boss?.maxHp || 1
  const currentHp = activeSession?.currentHp || 0
  const hpPercentage = Math.max(0, (currentHp / maxHp) * 100)
  const sortedAttendances = [...attendances].sort(
    (a, b) => b.damageDealt - a.damageDealt,
  )

  return (
    <div
      className="relative flex h-screen w-full select-none flex-col items-center overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-game.png')" }}
    >
      <div className="absolute left-10 top-10 z-10 flex flex-col drop-shadow-lg">
        <span className="text-lg font-bold uppercase tracking-widest text-white/80">
          เวลาเหลือ
        </span>
        <div
          className={`text-7xl font-black ${timeLeft < 10 ? 'animate-pulse text-red-500' : 'text-white'}`}
        >
          {timeLeft}
        </div>
      </div>

      <div className="absolute right-10 top-10 z-10 w-80 rounded-3xl border border-white/30 bg-white/40 p-5 shadow-2xl backdrop-blur-md">
        <div className="custom-scrollbar flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-2">
          {sortedAttendances.map((att, index) => (
            <div
              key={att.id}
              className="flex justify-between rounded bg-white/80 p-2 text-sm"
            >
              <span>
                {index + 1}. {att.user.firstName}
              </span>
              <span className="font-bold">
                {att.damageDealt.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="z-0 mt-20 flex w-full max-w-4xl flex-col items-center">
        <h1 className="mb-2 text-4xl font-black text-white drop-shadow-md">
          {boss?.bossName}
        </h1>
        <div className="relative mb-6 h-8 w-full max-w-2xl overflow-hidden rounded-full border-4 border-black bg-gray-900">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300"
            style={{ width: `${hpPercentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">
            {currentHp.toLocaleString()} / {maxHp.toLocaleString()}
          </div>
        </div>

        <div
          onClick={handleAttack}
          className={`relative h-[350px] w-full transition-all ${isStarted && currentHp > 0 ? 'cursor-pointer hover:scale-105 active:scale-95' : 'opacity-80 grayscale'} ${isAttacking ? 'brightness-150' : ''}`}
        >
          <CharacterScene url={boss?.modelUrl || ''} />

          {isAttacking && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl">
              💥
            </div>
          )}
        </div>

        <div className="animate-slide-up mt-4 w-full rounded-t-3xl border-t border-white/20 bg-black/60 p-4 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between px-4 text-white">
            <div className="flex gap-6">
              <div>
                <span className="text-sm uppercase text-gray-400">
                  เงินของคุณ
                </span>
                <div className="text-2xl font-bold text-yellow-400">
                  💰 {currentUserData?.user.points?.toLocaleString() || 0}
                </div>
              </div>
              <div>
                <span className="text-sm uppercase text-gray-400">
                  ดาเมจต่อการโจมตี
                </span>
                <div className="text-2xl font-bold text-red-400 transition-all duration-300">
                  ⚔️ {currentDamage.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-300">
              กดที่ไอเทมเพื่อซื้อ (จำกัด 1 ชิ้น)
            </div>
          </div>

          <div className="custom-scrollbar flex gap-4 overflow-x-auto">
            {shopItems?.map((item: any) => {
              const isOwned = checkIsOwned(item.id)

              return (
                <button
                  key={item.id}
                  disabled={isOwned}
                  onClick={() => handleBuyItem(item)}
                  className={`group relative flex h-36 w-28 flex-shrink-0 flex-col items-center rounded-xl border p-2 transition-all ${
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
                    className={`mb-1 h-12 w-12 object-contain drop-shadow-md ${isOwned ? 'grayscale-[0.2]' : ''}`}
                  />
                  <div className="line-clamp-1 text-xs font-bold text-white">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-green-300">
                    +{item.effectValue} ATK
                  </div>

                  <div
                    className={`mt-2 w-full rounded px-2 py-0.5 text-xs font-bold shadow-sm ${isOwned ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'} `}
                  >
                    {isOwned ? 'กำลังใช้งาน' : `${item.price} 💰`}
                  </div>

                  {isOwned && (
                    <div className="absolute right-2 top-2 text-xs text-green-400">
                      ✔
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {!isStarted &&
          currentHp > 0 &&
          (session?.user.role === 'TEACHER' ||
            session?.user.role === 'ADMIN') && (
            <div className="mt-3 flex">
              <button
                onClick={() => setIsStarted(true)}
                className="group relative rounded-full bg-blue-600 px-14 py-3 text-xl font-black text-white shadow-[0_10px_0_0_#1e40af] transition-all hover:-translate-y-1 hover:bg-blue-500 hover:shadow-[0_12px_0_0_#1e40af] active:translate-y-2 active:shadow-none"
              >
                เริ่มเกม
              </button>
            </div>
          )}
      </div>

      {session?.user.role === 'TEACHER' &&
        !isStarted &&
        !isGameOver &&
        currentHp > 0 && (
          <div className="absolute bottom-10 left-10 z-50">
            {attendances.length === 0 && (
              <div className="mb-2 w-max rounded bg-black p-2 text-xs text-white">
                รอให้นักเรียนเข้าห้องก่อนนะครับจารย์
              </div>
            )}
            <button
              onClick={handleStartGame}
              disabled={attendances.length === 0}
              className={`rounded-full px-8 py-4 text-2xl font-black text-white shadow-xl transition-all ${
                attendances.length > 0
                  ? 'animate-pulse bg-blue-600 hover:scale-105 hover:bg-blue-500'
                  : 'cursor-not-allowed bg-gray-600 opacity-50'
              }`}
            >
              เริ่มการต่อสู้
            </button>
          </div>
        )}

      {currentHp <= 0 && (
        <div className="animate-in fade-in absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md duration-500">
          <h2 className="animate-bounce text-8xl font-black text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.6)]">
            VICTORY!
          </h2>
          <p className="mt-4 text-2xl font-bold text-white">ภารกิจสำเร็จ!</p>

          <Link href={`/session/game/leader/${game.id}`}>
            <button className="mt-8 rounded-full bg-white px-8 py-3 font-bold text-black transition-all hover:scale-105 hover:bg-gray-200">
              สรุปผลคะแนน
            </button>
          </Link>
        </div>
      )}

      {isGameOver && currentHp > 0 && (
        <div className="animate-in fade-in absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md duration-500">
          <h2 className="text-8xl font-black text-red-600 drop-shadow-[0_0_25px_rgba(220,38,38,0.6)]">
            DEFEAT
          </h2>
          <p className="mt-4 text-2xl font-bold text-white">
            หมดเวลาแล้ว! บอสยังไม่ตาย
          </p>

          <Link href="/session/game">
            <button className="mt-8 rounded-full bg-red-600 px-8 py-3 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-red-500">
              สรุปผลคะแนน
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}
