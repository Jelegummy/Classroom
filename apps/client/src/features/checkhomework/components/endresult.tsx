import { useEffect, useState } from 'react'
import { SessionResult } from '../hooks/useSession'

type Props = {
  result: SessionResult | null
  onEnd: () => void
}

export default function Endresult({ result, onEnd }: Props) {
  const [canEnd, setCanEnd] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCanEnd(true), 1000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="">
      {canEnd ? (
        <button
          onClick={onEnd}
          className="mt-6 rounded-full bg-red-600 px-8 py-3 font-semibold text-white hover:bg-red-700"
        >
          สิ้นสุดการตอบคำถาม
        </button>
      ) : (
        <p className="mt-4 text-sm text-white">กรุณารอสักครู่...</p>
      )}
    </div>
  )
}
