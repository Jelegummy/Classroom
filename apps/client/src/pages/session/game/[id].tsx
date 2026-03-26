import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
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
import { io, Socket } from 'socket.io-client'

/* ─── Types ─────────────────────────────────────────── */
interface Item {
  id: string
  name: string
  description?: string
  price: number
  effectValue?: number
  imageUrl?: string
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
  startedAt?: string | Date
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
        inventory: Array<{ amount: number; item: Item }>
      }
    }>
  }>
}

interface FloatingNumber {
  id: number
  value: number
  x: number
  y: number
  isCrit: boolean
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  shape: 'circle' | 'spark' | 'star'
}

const SOCKET_URL = process.env.NEXT_PUBLIC_ENDPOINT

/* ─── Component ─────────────────────────────────────── */
export default function GameId() {
  const router = useRouter()
  const gameId = router.query.id as string
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const [isGameOver, setIsGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isAttacking, setIsAttacking] = useState(false)
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState(false)
  const [hitEffect, setHitEffect] = useState(false)
  const [floatingNums, setFloatingNums] = useState<FloatingNumber[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [combo, setCombo] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [bossRage, setBossRage] = useState(false)
  const [lastHpPercent, setLastHpPercent] = useState(100)
  const [xpGain, setXpGain] = useState<number | null>(null)
  const [totalXpGained, setTotalXpGained] = useState(0)
  const [clickAnim, setClickAnim] = useState(false)

  const comboTimerRef = useRef<NodeJS.Timeout | null>(null)
  const numIdRef = useRef(0)
  const particleIdRef = useRef(0)
  const socketRef = useRef<Socket | null>(null)
  const bossRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  /* ─── Fetch game ─────────────────────────────────── */
  const { data: game, isLoading } = useQuery<Game | undefined>({
    queryKey: ['getGameSession', gameId],
    queryFn: () => getGameSession(gameId),
    enabled: !!gameId,
  })

  /* ─── Socket ─────────────────────────────────────── */
  useEffect(() => {
    if (!gameId) return
    socketRef.current = io(SOCKET_URL)
    const socket = socketRef.current
    socket.on('connect', () => {
      socket.emit('join-game-room', gameId)
    })
    socket.on('game-state-updated', (updatedGameData: Game) => {
      queryClient.setQueryData(['getGameSession', gameId], updatedGameData)
    })
    return () => {
      if (socket.connected) {
        socket.emit('leave-game-room', gameId)
        socket.disconnect()
      }
    }
  }, [gameId, queryClient])

  /* ─── Particle animation loop ────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setParticles(prev => {
        const alive = prev.filter(p => p.life > 0)
        alive.forEach(p => {
          const alpha = p.life / p.maxLife
          ctx.save()
          ctx.globalAlpha = alpha
          ctx.fillStyle = p.color
          if (p.shape === 'star') {
            drawStar(ctx, p.x, p.y, p.size)
          } else if (p.shape === 'spark') {
            ctx.strokeStyle = p.color
            ctx.lineWidth = p.size * 0.4
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3)
            ctx.stroke()
          } else {
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.restore()
        })
        return alive.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15,
          life: p.life - 1,
          size: p.size * 0.97,
        }))
      })
      animFrameRef.current = requestAnimationFrame(loop)
    }
    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  function drawStar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
  ) {
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
      const ox = x + r * Math.cos(angle)
      const oy = y + r * Math.sin(angle)
      i === 0 ? ctx.moveTo(ox, oy) : ctx.lineTo(ox, oy)
    }
    ctx.closePath()
    ctx.fill()
  }

  /* ─── Spawn particles ────────────────────────────── */
  const spawnParticles = useCallback(
    (x: number, y: number, isCrit: boolean, power: number) => {
      const count = isCrit ? 40 : 20
      const colors = isCrit
        ? ['#ff4d00', '#ff8800', '#ffcc00', '#ffffff', '#ff2200']
        : ['#ff6600', '#ffaa00', '#ff4400', '#ffdd88']

      setParticles(prev => [
        ...prev,
        ...Array.from({ length: count }, () => {
          const angle = Math.random() * Math.PI * 2
          const speed = (Math.random() * 8 + 2) * (isCrit ? 1.5 : 1)
          const shape: Particle['shape'] =
            Math.random() < 0.3
              ? 'star'
              : Math.random() < 0.5
                ? 'spark'
                : 'circle'
          return {
            id: particleIdRef.current++,
            x: x + (Math.random() - 0.5) * 40,
            y: y + (Math.random() - 0.5) * 40,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            size: (Math.random() * 6 + 2) * (isCrit ? 1.3 : 1),
            color: colors[Math.floor(Math.random() * colors.length)],
            shape,
          }
        }),
      ])
    },
    [],
  )

  /* ─── Spawn XP orbs ──────────────────────────────── */
  const spawnXpOrbs = useCallback((x: number, y: number, amount: number) => {
    const colors = ['#00ffaa', '#00ccff', '#aaffcc', '#88ffee']
    setParticles(prev => [
      ...prev,
      ...Array.from({ length: Math.min(amount * 2, 15) }, () => {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 4 + 1
        return {
          id: particleIdRef.current++,
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed * 0.5,
          vy: Math.sin(angle) * speed - 4,
          life: 40 + Math.random() * 20,
          maxLife: 60,
          size: Math.random() * 5 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: 'circle' as const,
        }
      }),
    ])
  }, [])

  /* ─── Derived state ──────────────────────────────── */
  const isStarted = game?.status === 'ONGOING'

  const { data: shopItems } = useQuery({
    queryKey: ['getAllItems'],
    queryFn: () => getAllItems(),
  })

  const endGameMutation = useMutation({
    mutationFn: () => endGame(gameId),
    onError: (err: any) => toast.error(err.message || 'เกิดข้อผิดพลาด'),
  })

  const timeoutMutation = useMutation({
    mutationFn: () => timeoutBossGame(gameId),
    onSuccess: () => endGameMutation.mutate(),
    onError: () => endGameMutation.mutate(),
  })

  const attackMutation = useMutation({
    mutationFn: (damage: number) => attackBoss(gameId, damage),
  })

  const buyItemMutation = useMutation({
    mutationFn: (item: Item) =>
      buyItems({
        gameId,
        userId: session!.user.id,
        itemId: item.id,
        amount: 1,
      }),
    onSuccess: () => toast.success('ซื้อไอเทมสำเร็จ!'),
    onError: (err: any) => toast.error(err.message || 'เกิดข้อผิดพลาด'),
  })

  const startGameMutation = useMutation({
    mutationFn: () => startGame(gameId),
    onSuccess: () => toast.success('เริ่มเกมแล้ว!'),
    onError: (err: any) => toast.error(err.message || 'เกิดข้อผิดพลาด'),
  })

  const activeSession = game?.classrooms?.[0]
  const boss = game?.character
  const attendances = activeSession?.attendances || []

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

  /* ─── Timer ──────────────────────────────────────── */
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (isVictory) {
      return
    }

    if (isStarted && game?.startedAt && game?.timeLimit) {
      const startTime = new Date(game.startedAt).getTime()
      const endTime = startTime + game.timeLimit * 1000

      timer = setInterval(() => {
        const now = Date.now()
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
        setTimeLeft(remaining)

        if (remaining === 0 && !isGameOver && !isVictory) {
          setIsGameOver(true)
          if (
            session?.user.role === 'TEACHER' ||
            session?.user.role === 'ADMIN'
          ) {
            timeoutMutation.mutate()
          }
        }
      }, 1000)
    } else if (!isStarted && game?.timeLimit) {
      setTimeLeft(game.timeLimit)
    }

    return () => clearInterval(timer)
  }, [
    isStarted,
    game?.startedAt,
    game?.timeLimit,
    isGameOver,
    session,
    isVictory,
  ])

  /* ─── Boss rage mode ─────────────────────────────── */
  useEffect(() => {
    if (!game) return
    const maxHp = game.maxHpBoss || 1
    const currentHp = game.classrooms?.[0]?.currentHp || 0
    const hpPct = (currentHp / maxHp) * 100
    if (hpPct < 30 && lastHpPercent >= 30) setBossRage(true)
    setLastHpPercent(hpPct)
  }, [game])

  /* ─── Derived data ───────────────────────────────── */

  const currentUserData = useMemo(
    () => attendances.find(att => att.user.id === session?.user?.id),
    [attendances, session],
  )

  const currentDamage = useMemo(() => {
    const baseDamage = game?.damageBoost || 1
    if (!currentUserData) return baseDamage
    const itemBonus = currentUserData.user.inventory.reduce((sum, inv) => {
      if (inv.item.type === 'ATTACK_BOOST')
        return sum + (inv.item.effectValue ?? 0) * inv.amount
      return sum
    }, 0)
    return baseDamage + itemBonus
  }, [currentUserData, game?.damageBoost])

  /* ─── Attack handler ─────────────────────────────── */
  const handleAttack = () => {
    if (session?.user.role !== 'STUDENT') return
    if (!isStarted || timeLeft <= 0) return
    if (!activeSession || activeSession.currentHp <= 0) return

    const isCrit = Math.random() < 0.15
    const finalDamage = isCrit ? Math.floor(currentDamage * 2.5) : currentDamage
    const bossEl = bossRef.current
    const rect = bossEl?.getBoundingClientRect()
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2

    /* visual effects */
    setIsAttacking(true)
    setShake(true)
    setFlash(true)
    setHitEffect(true)
    setClickAnim(true)

    setTimeout(() => setIsAttacking(false), 150)
    setTimeout(() => setShake(false), 300)
    setTimeout(() => setFlash(false), 120)
    setTimeout(() => setHitEffect(false), 400)
    setTimeout(() => setClickAnim(false), 200)

    spawnParticles(cx, cy, isCrit, finalDamage)

    /* xp orb */
    const xp = Math.ceil(finalDamage * 0.5)
    setXpGain(xp)
    setTotalXpGained(p => p + xp)
    spawnXpOrbs(cx, cy, xp)
    setTimeout(() => setXpGain(null), 800)

    /* floating damage number */
    const id = numIdRef.current++
    const offsetX = (Math.random() - 0.5) * 120
    const offsetY = -80 - Math.random() * 40
    setFloatingNums(prev => [
      ...prev,
      { id, value: finalDamage, x: cx + offsetX, y: cy + offsetY, isCrit },
    ])
    setTimeout(
      () => setFloatingNums(prev => prev.filter(n => n.id !== id)),
      1200,
    )

    /* combo */
    setCombo(prev => {
      const next = prev + 1
      if (next >= 3) setShowCombo(true)
      return next
    })
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    comboTimerRef.current = setTimeout(() => {
      setCombo(0)
      setShowCombo(false)
    }, 2000)

    attackMutation.mutate(isCrit ? finalDamage : currentDamage)
  }

  const handleStartGame = () => {
    if (attendances.length === 0) {
      toast.error('รอนักเรียนเข้าห้องก่อนนะอาจารย์!')
      return
    }
    startGameMutation.mutate()
  }

  const checkIsOwned = (itemId: string) =>
    currentUserData?.user.inventory.some(inv => inv.item.id === itemId) ?? false

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
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-orange-500/30 border-t-orange-500" />
            <div className="absolute inset-2 animate-spin rounded-full border-4 border-yellow-500/20 border-t-yellow-400 [animation-direction:reverse]" />
          </div>
          <p className="font-['Cinzel'] text-sm tracking-[0.3em] text-orange-400/80">
            LOADING BATTLE...
          </p>
        </div>
      </div>
    )

  /* ─── Tier / rank helper ─────────────────────────── */
  const getRank = (index: number) => {
    if (index === 0)
      return {
        icon: '👑',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/20 border-yellow-500/40',
      }
    if (index === 1)
      return {
        icon: '🥈',
        color: 'text-slate-300',
        bg: 'bg-slate-500/20 border-slate-500/40',
      }
    if (index === 2)
      return {
        icon: '🥉',
        color: 'text-amber-600',
        bg: 'bg-amber-700/20 border-amber-600/40',
      }
    return {
      icon: `${index + 1}`,
      color: 'text-gray-400',
      bg: 'bg-white/5 border-white/10',
    }
  }

  const timeColor = () => {
    if (timeLeft > 30) return 'text-white'
    if (timeLeft > 10) return 'text-orange-400'
    return 'text-red-500'
  }

  return (
    <>
      {/* ── Google Font ──────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        .font-cinzel  { font-family: 'Cinzel', serif; }
        .font-rajdhani{ font-family: 'Rajdhani', sans-serif; }

        @keyframes shake {
          0%,100%{transform:translate(0,0) rotate(0)}
          10%{transform:translate(-8px,-4px) rotate(-1deg)}
          20%{transform:translate(8px,4px) rotate(1deg)}
          30%{transform:translate(-6px,6px) rotate(0)}
          40%{transform:translate(6px,-6px) rotate(-0.5deg)}
          50%{transform:translate(-4px,4px)}
          60%{transform:translate(4px,-2px)}
          70%{transform:translate(-2px,2px)}
          80%{transform:translate(2px,-1px)}
        }
        @keyframes floatUp {
          0%{opacity:1;transform:translateY(0) scale(1)}
          60%{opacity:1}
          100%{opacity:0;transform:translateY(-100px) scale(0.8)}
        }
        @keyframes critFloat {
          0%{opacity:1;transform:translateY(0) scale(1) rotate(-5deg)}
          30%{transform:translateY(-30px) scale(1.4) rotate(3deg)}
          100%{opacity:0;transform:translateY(-120px) scale(0.7) rotate(-2deg)}
        }
        @keyframes xpFloat {
          0%{opacity:1;transform:translateY(0) scale(1)}
          100%{opacity:0;transform:translateY(-60px) scale(0.9)}
        }
        @keyframes comboIn {
          0%{transform:scale(0) rotate(-10deg);opacity:0}
          60%{transform:scale(1.2) rotate(3deg);opacity:1}
          100%{transform:scale(1) rotate(0);opacity:1}
        }
        @keyframes bossRageShake {
          0%,100%{transform:translateX(0)}
          25%{transform:translateX(-3px)}
          75%{transform:translateX(3px)}
        }
        @keyframes hpFlash {
          0%,100%{opacity:1}
          50%{opacity:0.4}
        }
        @keyframes hitRing {
          0%{transform:scale(0.5);opacity:1}
          100%{transform:scale(3);opacity:0}
        }
        @keyframes scanline {
          0%{transform:translateY(-100%)}
          100%{transform:translateY(100vh)}
        }
        @keyframes borderGlow {
          0%,100%{box-shadow:0 0 8px #ff6600,0 0 20px #ff440040}
          50%{box-shadow:0 0 16px #ff8800,0 0 40px #ff440080}
        }
        @keyframes xpBar {
          from{width:0%}
          to{width:100%}
        }
        @keyframes rageFlicker {
          0%,100%{filter:brightness(1)}
          50%{filter:brightness(1.3) saturate(1.5)}
        }
        @keyframes badgePulse {
          0%,100%{transform:scale(1)}
          50%{transform:scale(1.08)}
        }
        @keyframes slideUp {
          from{transform:translateY(100%);opacity:0}
          to{transform:translateY(0);opacity:1}
        }
        @keyframes victoryBurst {
          0%{transform:scale(0.5);opacity:0}
          60%{transform:scale(1.1);opacity:1}
          100%{transform:scale(1);opacity:1}
        }

        .shake-anim { animation: shake 0.3s ease; }
        .boss-rage  { animation: bossRageShake 0.15s infinite, rageFlicker 0.5s infinite; }
        .hit-ring   { animation: hitRing 0.5s ease-out forwards; }
        .combo-in   { animation: comboIn 0.3s cubic-bezier(.17,.67,.41,1.4) forwards; }
        .slide-up   { animation: slideUp 0.4s ease forwards; }

        .hp-bar-fill {
          transition: width 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        .hp-bar-fill::after {
          content:'';
          position:absolute;
          top:0;left:-100%;
          width:50%;height:100%;
          background: linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent);
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0%{left:-100%}
          100%{left:200%}
        }

        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,120,0,0.4); border-radius: 2px; }

        .scanline::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px);
          pointer-events: none;
          z-index: 1;
        }

        .boss-click { transition: transform 0.1s ease, filter 0.1s ease; }
        .boss-click:active, .boss-clicking { transform: scale(0.96) !important; filter: brightness(1.5) saturate(1.5) !important; }
      `}</style>

      {/* ── Root wrapper ───────────────────────────────── */}
      <div
        className={`scanline relative flex h-[100dvh] w-full select-none flex-col items-center overflow-hidden ${shake ? 'shake-anim' : ''}`}
        style={{
          backgroundImage: "url('/bg-game.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: "'Rajdhani', sans-serif",
        }}
      >
        {/* dark overlay */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)',
          }}
        />

        {/* ── FLASH on hit ────────────────────────────── */}
        {flash && (
          <div
            className="pointer-events-none absolute inset-0 z-50"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,140,0,0.35) 0%, transparent 70%)',
            }}
          />
        )}

        {/* ── Particle canvas ─────────────────────────── */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-40"
          style={{ mixBlendMode: 'screen' }}
        />

        {/* ── Hit ring effect ─────────────────────────── */}
        {hitEffect && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2">
            <div className="hit-ring h-40 w-40 rounded-full border-4 border-orange-400/80" />
            <div
              className="hit-ring h-40 w-40 rounded-full border-2 border-yellow-300/60"
              style={{ animationDelay: '0.1s', position: 'absolute', inset: 0 }}
            />
          </div>
        )}

        {/* ── Floating damage numbers ──────────────────── */}
        {floatingNums.map(num => (
          <div
            key={num.id}
            className="font-cinzel pointer-events-none fixed z-50 font-black"
            style={{
              left: num.x,
              top: num.y,
              transform: 'translate(-50%, -50%)',
              animation: num.isCrit
                ? 'critFloat 1.2s ease-out forwards'
                : 'floatUp 1s ease-out forwards',
              fontSize: num.isCrit ? '3.5rem' : '2rem',
              color: num.isCrit ? '#ffdd00' : '#ff6600',
              textShadow: num.isCrit
                ? '0 0 20px #ff8800, 0 0 40px #ff4400, 2px 2px 0 #000'
                : '0 0 10px #ff4400, 2px 2px 0 #000',
              WebkitTextStroke: num.isCrit ? '1px #ff2200' : '0.5px #000',
            }}
          >
            {num.isCrit && (
              <span
                className="block text-center text-lg"
                style={{
                  color: '#ff4444',
                  fontSize: '1.2rem',
                  marginBottom: '-8px',
                }}
              >
                CRITICAL!
              </span>
            )}
            -{num.value.toLocaleString()}
          </div>
        ))}

        {/* ── COMBO ────────────────────────────────────── */}
        {showCombo && combo >= 3 && (
          <div
            className="combo-in font-cinzel pointer-events-none fixed left-1/2 top-[35%] z-50 -translate-x-1/2 text-center"
            style={{ filter: 'drop-shadow(0 0 20px rgba(255,200,0,0.8))' }}
          >
            <div
              style={{
                fontSize: '1rem',
                color: '#ffaa00',
                letterSpacing: '0.4em',
              }}
            >
              COMBO
            </div>
            <div
              style={{
                fontSize: '3.5rem',
                fontWeight: 900,
                color: '#ffee00',
                WebkitTextStroke: '2px #ff6600',
                lineHeight: 1,
              }}
            >
              x{combo}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* TOP HUD */}
        {/* ════════════════════════════════════════════ */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex w-full items-start justify-between gap-2 p-3 md:p-5">
          {/* ── Timer ────────────────────────────────── */}
          <div className="pointer-events-auto">
            <div
              className="relative overflow-hidden rounded-xl border border-white/10 bg-black/70 px-4 py-2 backdrop-blur-md"
              style={{
                boxShadow:
                  timeLeft < 10 && isStarted
                    ? '0 0 20px rgba(255,50,50,0.6)'
                    : '0 0 10px rgba(0,0,0,0.5)',
              }}
            >
              <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-orange-400/80 md:text-xs">
                ⏱ เวลาเหลือ
              </div>
              <div
                className={`font-cinzel text-4xl font-black leading-none md:text-6xl ${timeColor()} ${timeLeft < 10 && isStarted ? 'animate-pulse' : ''}`}
                style={{ textShadow: '0 0 20px currentColor' }}
              >
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                {String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* ── Boss HP bar (center) ──────────────────── */}
          <div className="pointer-events-auto absolute left-1/2 top-3 mt-60 w-[45%] max-w-md -translate-x-1/2 sm:mt-36 md:top-5 md:w-[40%]">
            <div
              className="font-cinzel mb-1 text-center text-sm font-bold tracking-widest text-white/80 md:text-base"
              style={{ textShadow: '0 0 10px rgba(255,100,0,0.5)' }}
            >
              {boss?.bossName || 'BOSS'}
              {bossRage && (
                <span className="ml-2 animate-pulse text-xs text-red-400">
                  ⚡ RAGE
                </span>
              )}
            </div>
            <div
              className="relative h-5 w-full overflow-hidden rounded-full border border-white/20 bg-black/80 md:h-7"
              style={{
                boxShadow: bossRage
                  ? '0 0 15px rgba(255,0,0,0.6)'
                  : '0 0 8px rgba(0,0,0,0.8)',
              }}
            >
              {/* danger zone marker */}
              <div className="absolute left-[30%] top-0 z-10 h-full w-px bg-orange-400/40" />
              <div
                className={`hp-bar-fill h-full rounded-full ${bossRage ? 'bg-gradient-to-r from-red-700 via-red-500 to-orange-500' : 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500'}`}
                style={{ width: `${hpPercentage}%` }}
              />
              <div
                className="font-rajdhani absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white md:text-xs"
                style={{ textShadow: '1px 1px 2px #000' }}
              >
                {currentHp.toLocaleString()} / {maxHp.toLocaleString()}
              </div>
            </div>
          </div>

          {/* ── Leaderboard ───────────────────────────── */}
          <div className="pointer-events-auto w-36 md:w-60">
            <div
              className="overflow-hidden rounded-xl border border-orange-500/20 bg-black/75 backdrop-blur-md"
              style={{ boxShadow: '0 0 20px rgba(255,100,0,0.1)' }}
            >
              <div className="border-b border-orange-500/20 px-2 py-1.5 md:px-3">
                <span className="font-cinzel text-[9px] font-bold uppercase tracking-[0.2em] text-orange-400 md:text-xs">
                  ⚔ Leaderboard
                </span>
              </div>
              <div className="custom-scrollbar flex max-h-[22vh] flex-col gap-0.5 overflow-y-auto p-1 md:max-h-[45vh] md:p-2">
                {sortedAttendances.length === 0 ? (
                  <div className="py-3 text-center text-[10px] text-gray-500">
                    รอนักเรียน...
                  </div>
                ) : (
                  sortedAttendances.map((att, index) => {
                    const rank = getRank(index)
                    const isMe = att.user.id === session?.user?.id
                    return (
                      <div
                        key={att.id}
                        className={`flex items-center justify-between rounded-lg border px-2 py-1 transition-all ${rank.bg} ${isMe ? 'ring-1 ring-orange-400/50' : ''}`}
                      >
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span
                            className={`shrink-0 text-[10px] font-bold md:text-sm ${rank.color}`}
                          >
                            {rank.icon}
                          </span>
                          <span
                            className={`font-rajdhani truncate text-[10px] font-semibold md:text-sm ${isMe ? 'text-orange-300' : 'text-gray-200'}`}
                          >
                            {att.user.firstName}
                            {isMe && (
                              <span className="ml-1 text-orange-400">◀</span>
                            )}
                          </span>
                        </div>
                        <span className="font-cinzel shrink-0 text-[9px] font-bold text-red-400 md:text-xs">
                          {att.damageDealt.toLocaleString()}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* BOSS SCENE (center) */}
        {/* ════════════════════════════════════════════ */}
        <div className="z-10 flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 pt-28 md:pt-20">
          {/* Boss 3D model */}
          <div
            ref={bossRef}
            onClick={handleAttack}
            className={`boss-click relative h-[300px] w-full max-w-[400px] md:h-[420px] ${isStarted && currentHp > 0 ? 'cursor-pointer' : 'opacity-60 grayscale'} ${clickAnim ? 'boss-clicking' : ''} ${bossRage ? 'boss-rage' : ''}`}
          >
            <CharacterScene url={boss?.modelUrl || ''} />

            {/* attack flash overlay */}
            {isAttacking && (
              <div
                className="pointer-events-none absolute inset-0 rounded-xl"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(255,200,0,0.4) 0%, transparent 70%)',
                }}
              />
            )}

            {/* WAITING hint */}
            {!isStarted &&
              !isGameOver &&
              currentHp > 0 &&
              session?.user.role === 'STUDENT' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-xl border border-white/20 bg-black/60 px-5 py-3 text-center backdrop-blur-sm">
                    <div className="font-cinzel text-sm font-bold text-yellow-400 md:text-base">
                      WAITING
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      รอเริ่มเกม...
                    </div>
                  </div>
                </div>
              )}

            {/* tap hint ripple - only in playing state */}
            {isStarted &&
              currentHp > 0 &&
              session?.user.role === 'STUDENT' &&
              !isAttacking && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
                  <span className="font-rajdhani animate-bounce text-xs text-white/50">
                    TAP TO ATTACK
                  </span>
                </div>
              )}
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* STUDENT BOTTOM PANEL */}
        {/* ════════════════════════════════════════════ */}
        {session?.user.role === 'STUDENT' && (
          <div
            className="slide-up pb-safe relative z-20 w-full shrink-0 border-t border-orange-500/20 bg-black/85 backdrop-blur-xl"
            style={{ boxShadow: '0 -4px 40px rgba(255,100,0,0.15)' }}
          >
            {/* ── Stats strip ───────────────────────── */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
              <div className="flex items-center gap-3">
                {/* Gold */}
                <div className="flex items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1">
                  <span className="text-sm">💰</span>
                  <span className="font-cinzel text-sm font-bold text-yellow-400">
                    {currentUserData?.user.points?.toLocaleString() || 0}
                  </span>
                </div>
                {/* ATK */}
                <div className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1">
                  <span className="text-sm">⚔️</span>
                  <span className="font-cinzel text-sm font-bold text-red-400">
                    {currentDamage.toLocaleString()}
                  </span>
                </div>
                {/* My rank */}
                {currentUserData && (
                  <div className="hidden items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1 md:flex">
                    <span className="text-sm">🗡️</span>
                    <span className="font-cinzel text-sm font-bold text-purple-300">
                      {currentUserData.damageDealt.toLocaleString()} DMG
                    </span>
                  </div>
                )}
              </div>
              <div className="font-rajdhani text-[10px] text-gray-500 md:text-xs">
                กดไอเทมเพื่อซื้อ (จำกัด 1 ชิ้น)
              </div>
            </div>

            {/* ── Shop items ────────────────────────── */}
            <div className="custom-scrollbar flex gap-2 overflow-x-auto px-4 py-3 md:gap-3">
              {shopItems?.map((item: any) => {
                const isOwned = checkIsOwned(item.id)
                return (
                  <button
                    key={item.id}
                    disabled={isOwned}
                    onClick={() => handleBuyItem(item)}
                    className="group relative flex h-24 w-20 shrink-0 flex-col items-center overflow-hidden rounded-xl border transition-all duration-200 md:h-32 md:w-28"
                    style={{
                      borderColor: isOwned
                        ? 'rgba(34,197,94,0.5)'
                        : 'rgba(255,150,0,0.3)',
                      background: isOwned
                        ? 'rgba(34,197,94,0.08)'
                        : 'rgba(255,100,0,0.05)',
                      boxShadow: isOwned
                        ? 'inset 0 0 15px rgba(34,197,94,0.1)'
                        : 'none',
                    }}
                  >
                    {/* glow on hover */}
                    {!isOwned && (
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        style={{
                          background:
                            'radial-gradient(ellipse at center, rgba(255,140,0,0.15) 0%, transparent 70%)',
                        }}
                      />
                    )}

                    <div className="mt-2 flex h-10 w-10 items-center justify-center md:h-14 md:w-14">
                      <Image
                        src={item.imageUrl || '/catIcon.jpg'}
                        alt={item.name}
                        width={56}
                        height={56}
                        className={`h-full w-full object-contain drop-shadow-lg transition-transform duration-200 group-hover:scale-110 ${isOwned ? '' : ''}`}
                      />
                    </div>

                    <div className="font-rajdhani mt-1 line-clamp-1 px-1 text-center text-[9px] font-bold text-white md:text-[11px]">
                      {item.name}
                    </div>
                    <div className="text-[8px] text-orange-300/80 md:text-[10px]">
                      +{item.effectValue} ATK
                    </div>

                    <div
                      className={`font-rajdhani mt-auto w-full py-0.5 text-center text-[8px] font-bold md:text-[10px] ${isOwned ? 'bg-emerald-500/80 text-emerald-100' : 'bg-orange-500/80 text-white'}`}
                    >
                      {isOwned ? '✓ ใช้งาน' : `${item.price} 💰`}
                    </div>

                    {isOwned && (
                      <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">
                        ✓
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* TEACHER START BUTTON */}
        {/* ════════════════════════════════════════════ */}
        {(session?.user.role === 'TEACHER' || session?.user.role === 'ADMIN') &&
          !isStarted &&
          !isGameOver &&
          currentHp > 0 && (
            <div className="absolute bottom-8 left-1/2 z-50 flex w-[90%] -translate-x-1/2 flex-col items-center md:bottom-10 md:left-10 md:w-auto md:translate-x-0 md:items-start">
              {attendances.length === 0 && (
                <div className="mb-3 rounded-xl border border-yellow-500/30 bg-black/80 px-4 py-2 text-center text-xs text-yellow-400 backdrop-blur-sm">
                  รอให้นักเรียนเข้าห้องก่อนนะครับอาจารย์
                </div>
              )}
              <button
                onClick={handleStartGame}
                disabled={attendances.length === 0}
                className={`font-cinzel group relative w-full overflow-hidden rounded-2xl text-xl font-black text-white shadow-2xl transition-all md:w-auto md:px-12 md:py-5 md:text-2xl ${
                  attendances.length > 0
                    ? 'cursor-pointer bg-gradient-to-r from-orange-600 to-red-600 hover:scale-105 hover:from-orange-500 hover:to-red-500'
                    : 'cursor-not-allowed bg-gray-700 opacity-40'
                }`}
                style={{
                  boxShadow:
                    attendances.length > 0
                      ? '0 0 30px rgba(255,80,0,0.5), 0 4px 20px rgba(0,0,0,0.5)'
                      : 'none',
                  padding: '14px 40px',
                }}
              >
                {attendances.length > 0 && (
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform group-hover:translate-x-full" />
                )}
                ⚔ เริ่มการต่อสู้
              </button>
            </div>
          )}

        {/* ════════════════════════════════════════════ */}
        {/* VICTORY */}
        {/* ════════════════════════════════════════════ */}
        {isVictory && !isDefeat && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-black/85 backdrop-blur-md">
            {/* background rays */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-20"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, rgba(255,220,0,0.3) 10deg, transparent 20deg, transparent 30deg, rgba(255,180,0,0.3) 40deg, transparent 50deg, transparent 160deg, rgba(255,220,0,0.2) 170deg, transparent 180deg, transparent 340deg, rgba(255,180,0,0.3) 350deg, transparent 360deg)',
              }}
            />

            <div
              style={{
                animation:
                  'victoryBurst 0.6s cubic-bezier(.17,.67,.41,1.4) forwards',
              }}
              className="flex flex-col items-center text-center"
            >
              <div
                className="font-cinzel text-7xl font-black md:text-9xl"
                style={{
                  color: '#ffdd00',
                  textShadow: '0 0 40px #ff8800, 0 0 80px #ff440080',
                  WebkitTextStroke: '2px #ff6600',
                }}
              >
                VICTORY
              </div>
              <div className="font-rajdhani mt-2 text-xl font-semibold text-yellow-200/80 md:text-2xl">
                🏆 ภารกิจสำเร็จ! พวกคุณทำได้!
              </div>

              <Link href={`/session/game/leader/${game.id}`}>
                <button
                  className="font-cinzel mt-8 rounded-full border border-yellow-400/50 bg-yellow-500/20 px-8 py-3 text-base font-bold text-yellow-300 shadow-xl transition-all hover:scale-105 hover:bg-yellow-500/30 md:px-12 md:text-lg"
                  style={{ boxShadow: '0 0 20px rgba(255,200,0,0.3)' }}
                >
                  ดูสรุปผลคะแนน →
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* DEFEAT */}
        {/* ════════════════════════════════════════════ */}
        {isDefeat && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
            <div
              className="flex flex-col items-center text-center"
              style={{ animation: 'victoryBurst 0.6s ease forwards' }}
            >
              <div
                className="font-cinzel text-7xl font-black md:text-9xl"
                style={{
                  color: '#cc2222',
                  textShadow: '0 0 40px #ff0000, 0 0 80px #ff000040',
                  WebkitTextStroke: '2px #880000',
                }}
              >
                DEFEAT
              </div>
              <div className="font-rajdhani mt-2 text-xl font-semibold text-red-300/70 md:text-2xl">
                หมดเวลาแล้ว! บอสยังไม่ตาย
              </div>

              <Link href={`/session/game/leader/${game.id}`}>
                <button
                  className="font-cinzel mt-8 rounded-full border border-red-500/40 bg-red-600/20 px-8 py-3 text-base font-bold text-red-300 shadow-xl transition-all hover:scale-105 hover:bg-red-600/30 md:px-12 md:text-lg"
                  style={{ boxShadow: '0 0 20px rgba(200,0,0,0.3)' }}
                >
                  ดูสรุปผลคะแนน →
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
