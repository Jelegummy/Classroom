import { Countdown } from '../hooks/countdown'

type Props = {
  active: boolean
  duration: number
}

export default function CountdownTimer({ active, duration }: Props) {
  const timeLeft = Countdown(active, duration)

  if (!active) return null

  return (
    <div className="absolute right-4 top-52 flex flex-col items-center">
      <div
        className={`text-5xl font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}
      >
        {timeLeft}
      </div>
      <p className="mt-1 text-sm text-gray-400">วินาที</p>
      <div className="mt-2 flex items-center gap-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <span className="text-xs text-red-400">กำลังบันทึก</span>
      </div>
    </div>
  )
}
