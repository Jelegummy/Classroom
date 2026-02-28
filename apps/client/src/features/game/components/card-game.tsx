import { createGameSession } from '@/services/game-session'
import { CreateGameArgs } from '@/services/game-session/types'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { RiSwordLine } from 'react-icons/ri'
import { useRouter } from 'next/dist/client/components/navigation'
import { CardGameProps } from '../types'

export default function CardGame({ classroomId, characterId }: CardGameProps) {
  const router = useRouter()
  const [openModal, setOpenModal] = useState(false)
  const [createdGameId, setCreatedGameId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    timeLimit: 0,
    damageBoost: 0,
    maxHpBoss: 0,
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
      setForm({ name: '', timeLimit: 0, damageBoost: 0, maxHpBoss: 0 })
    },
    onError: e => toast.error(e?.message || 'เกิดข้อผิดพลาด'),
  })

  const onSubmit = () => {
    if (!classroomId) {
      toast.error('ไม่พบข้อมูลห้องเรียน')
      return
    }
    if (!characterId) {
      toast.error('กรุณาเลือกตัวละครก่อนเริ่มเกม')
      return
    }
    if (!form.name.trim()) {
      toast.error('กรุณากรอกชื่อเกม')
      return
    }

    createGame.mutate({
      name: form.name,
      timeLimit: form.timeLimit,
      damageBoost: form.damageBoost,
      maxHpBoss: form.maxHpBoss,
      classroomId: classroomId,
      characterId: characterId,
    })
  }

  return (
    <div className="w-full rounded-xl border border-white/50 bg-white/80 p-2 shadow-xl backdrop-blur-lg lg:max-w-sm lg:rounded-3xl lg:bg-white/40 lg:p-6">
      <div className="flex flex-col gap-1 lg:gap-4">
        <div className="grid grid-cols-2 gap-1 lg:flex lg:flex-col lg:gap-4">
          <div className="flex flex-col">
            <label className="ml-1 text-sm font-bold text-gray-800 lg:text-sm">
              ชื่อเกม
            </label>
            <input
              type="text"
              className="w-full rounded border border-black px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-200 lg:rounded-xl lg:border-2 lg:px-4 lg:py-2 lg:text-lg lg:focus:ring-4"
              placeholder="อาทิตย์ที่ 1"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <label className="ml-1 text-sm font-bold text-gray-800 lg:text-sm">
              เวลา (วิ)
            </label>
            <input
              type="number"
              className="w-full rounded border border-black px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-200 lg:rounded-xl lg:border-2 lg:px-4 lg:py-2 lg:text-lg lg:focus:ring-4"
              value={form.timeLimit || ''}
              placeholder="100"
              onChange={e =>
                setForm({ ...form, timeLimit: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 lg:flex lg:flex-col lg:gap-4">
          <div className="flex flex-col">
            <label className="ml-1 text-sm font-bold text-gray-800 lg:text-sm">
              ดาเมจ
            </label>
            <input
              type="number"
              className="w-full rounded border border-black px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-200 lg:rounded-xl lg:border-2 lg:px-4 lg:py-2 lg:text-lg lg:focus:ring-4"
              value={form.damageBoost || ''}
              placeholder="1"
              onChange={e =>
                setForm({ ...form, damageBoost: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex flex-col">
            <label className="ml-1 text-sm font-bold text-gray-800 lg:text-sm">
              เลือดบอส
            </label>
            <input
              type="number"
              className="w-full rounded border border-black px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-blue-200 lg:rounded-xl lg:border-2 lg:px-4 lg:py-2 lg:text-lg lg:focus:ring-4"
              value={form.maxHpBoss || ''}
              placeholder="5000"
              onChange={e =>
                setForm({ ...form, maxHpBoss: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={createGame.isPending}
          className={`mt-1 flex w-full items-center justify-center gap-1 rounded-lg border-[1.5px] border-black py-1 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[1px] active:shadow-none lg:mt-2 lg:gap-2 lg:rounded-xl lg:border-[3px] lg:py-3 lg:shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] ${characterId ? 'cursor-pointer bg-[#3b82f6] hover:bg-blue-600' : 'cursor-not-allowed bg-gray-400 opacity-70'}`}
        >
          <RiSwordLine className="h-3 w-3 text-white lg:h-6 lg:w-6" />
          <span className="text-sm font-bold text-white drop-shadow-lg lg:text-xl">
            {createGame.isPending ? 'กำลังสร้าง...' : 'สร้างเกม'}
          </span>
        </button>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-2 backdrop-blur-sm lg:p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl lg:rounded-2xl lg:p-6">
            <h2 className="text-sm font-bold text-gray-800 lg:text-xl">
              สร้างเกมสำเร็จแล้ว
            </h2>
            <p className="mt-1 text-sm text-gray-600 lg:mt-2 lg:text-base">
              ต้องการเริ่มเกมนี้เลยหรือไม่?
            </p>
            <div className="mt-3 flex gap-2 lg:mt-6 lg:gap-3">
              <button
                className="flex-1 rounded-lg border border-gray-300 bg-red-400 py-1.5 text-sm font-semibold text-white hover:bg-red-500 lg:rounded-xl lg:border-2 lg:py-2 lg:text-base"
                onClick={() => {
                  setOpenModal(false)
                  router.push(`/session/game/${classroomId}`)
                }}
              >
                ยังไม่เริ่ม
              </button>
              <button
                className="flex-1 rounded-lg bg-blue-600 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 lg:rounded-xl lg:py-2 lg:text-base"
                onClick={() => {
                  if (!createdGameId) return
                  router.push(`/session/game/${createdGameId}`)
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
