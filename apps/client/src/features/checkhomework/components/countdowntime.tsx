import { Countdown } from '../hooks/countdown'

type Props = {
  active: boolean
  duration: number
}

export default function CountdownTimer({ active, duration }: Props) {
  const timeLeft = Countdown(active, duration)

  if (!active) return null

  return (
    <div className="flex flex-col items-center">
      {timeLeft == 0 ? (
        <div className="grid items-center rounded-2xl bg-slate-900 p-3 text-xl text-white">
          กำลังประมวลผล...
        </div>
      ) : (
        <div className="grid items-center rounded-2xl bg-slate-900 p-3">
          <div
            className={`flex items-center justify-center text-5xl font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}
          >
            {timeLeft}
          </div>
          <div className="mt-2 flex items-center gap-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="text-xs text-red-400">กำลังบันทึก</span>
          </div>
        </div>
      )}
    </div>
  )
}
