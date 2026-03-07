import { useEffect, useState } from 'react'
import { SessionResult } from '../hooks/useSession'

type Props = {
  result: SessionResult | null
  onEnd: () => void
}

export default function EndresultOverlay({ result, onEnd }: Props) {
  const [canEnd, setCanEnd] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCanEnd(true), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70">
      {result && (
        <>
          <p className="text-4xl font-bold text-white">
            {result.passed ? '🎉 ผ่านแล้ว!' : '❌ ยังไม่ผ่าน'}
          </p>
          <p className="mt-3 text-2xl text-gray-200">
            ตอบถูก {result.correct} / {result.total} ข้อ
          </p>
        </>
      )}
      <p className="mt-4 text-gray-400">การทดสอบเสร็จสิ้นแล้ว</p>

      {canEnd ? (
        <button
          onClick={onEnd}
          className="mt-6 rounded-full bg-white px-8 py-3 font-semibold text-gray-800 hover:bg-gray-100"
        >
          กลับหน้าการบ้าน
        </button>
      ) : (
        <p className="mt-4 text-sm text-gray-500">กรุณารอสักครู่...</p>
      )}
    </div>
  )
}
