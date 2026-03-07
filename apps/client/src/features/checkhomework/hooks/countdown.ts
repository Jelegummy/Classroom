import { useEffect, useState } from 'react'

export function Countdown(active: boolean, duration: number) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    if (!active) {
      setTimeLeft(duration)
      return
    }
    setTimeLeft(duration)
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [active])

  return timeLeft
}