import { createGameSession } from '@/services/game-session'
import { CreateGameArgs } from '@/services/game-session/types'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { RiSwordLine } from 'react-icons/ri'
import { useRouter } from 'next/dist/client/components/navigation'

type CardGameProps = {
  classroomId: string
  characterId: string
}

export default function CardGame({ classroomId, characterId }: CardGameProps) {
  const router = useRouter()
  const [openModal, setOpenModal] = useState(false)
  const [createdGameId, setCreatedGameId] = useState<string | null>(null)
  const [form, setForm] = useState<{
    name: string
    timeLimit: number
    damageBoost: number
  }>({
    name: '',
    timeLimit: 0,
    damageBoost: 0,
  })

  const createGame = useMutation({
    mutationFn: (args: CreateGameArgs) => createGameSession(args),
    onSuccess: res => {
      toast.success('สร้างเกมสำเร็จ')

      const gameId = res?.id
      if (!gameId) {
        toast.error('ไม่พบ game id')
        return
      }

      setCreatedGameId(gameId)
      setOpenModal(true)

      setForm({ name: '', timeLimit: 0, damageBoost: 0 })
    },
    onError: e => {
      toast.error(e?.message || 'เกิดข้อผิดพลาด')
    },
  })

  const onSubmit = () => {
    if (!classroomId) {
      toast.error('ไม่พบข้อมูลห้องเรียน (Classroom ID missing)')
      return
    }
    if (!characterId) {
      toast.error('กรุณาเลือกตัวละครก่อนเริ่มเกม')
      return
    }
    if (!form.name.trim()) {
      toast.error('กรุณากรอกชื่อเกม (พลังชีวิตของบอส)')
      return
    }

    const payload: CreateGameArgs = {
      name: form.name,
      timeLimit: form.timeLimit,
      damageBoost: form.damageBoost,
      classroomId: classroomId,
      characterId: characterId,
    }

    createGame.mutate(payload)
  }

  return (
    <div className="fixed bottom-6 right-1 z-50 w-full max-w-sm rounded-3xl border border-white/50 bg-white/40 p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="ml-1 text-sm font-bold text-gray-800">
            ชื่อเกม
          </label>
          <input
            type="text"
            className="w-full rounded-xl border-2 border-black bg-white px-4 py-2 text-lg outline-none focus:ring-4 focus:ring-blue-200"
            placeholder="อาทิตย์ที่ 1"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1 text-sm font-bold text-gray-800">
            ดาเมจการโจมตี (ต่อครั้ง)
          </label>
          <input
            type="number"
            className="w-full rounded-xl border-2 border-black bg-white px-4 py-2 text-lg outline-none focus:ring-4 focus:ring-blue-200"
            value={form.damageBoost || ''}
            onChange={e =>
              setForm({ ...form, damageBoost: Number(e.target.value) })
            }
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="ml-1 text-sm font-bold text-gray-800">
            เวลาในการเช็คชื่อ (วินาที)
          </label>
          <input
            type="number"
            className="w-full rounded-xl border-2 border-black bg-white px-4 py-2 text-lg outline-none focus:ring-4 focus:ring-blue-200"
            value={form.timeLimit || ''}
            placeholder="100"
            onChange={e =>
              setForm({ ...form, timeLimit: Number(e.target.value) })
            }
          />
        </div>

        <button
          onClick={onSubmit}
          disabled={createGame.isPending}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-[3px] border-black py-3 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-none ${characterId ? 'cursor-pointer bg-[#3b82f6] hover:bg-blue-600' : 'cursor-not-allowed bg-gray-400 opacity-70'} `}
        >
          <RiSwordLine className="h-6 w-6 text-white" />
          <span className="text-xl font-bold text-white drop-shadow-md">
            {createGame.isPending ? 'กำลังสร้าง...' : 'สร้างเกม'}
          </span>
        </button>
      </div>
      {openModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800">
              สร้างเกมสำเร็จแล้ว
            </h2>
            <p className="mt-2 text-gray-600">ต้องการเริ่มเกมนี้เลยหรือไม่?</p>

            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-xl border-2 border-gray-300 bg-red-400 py-2 font-semibold text-white hover:bg-red-500"
                onClick={() => {
                  setOpenModal(false)
                  router.push(`/dashboard/teacher/classroom/${classroomId}`)
                }}
              >
                ยังไม่เริ่ม
              </button>
              <button
                className="flex-1 rounded-xl bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
                onClick={() => {
                  if (!createdGameId) return
                  router.push(`/dashboard/teacher/game/${createdGameId}`)
                }}
              >
                เริ่มเกมเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
