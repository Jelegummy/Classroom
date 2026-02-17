import { useState } from 'react'
import { rewardOwner } from '@/services/classroom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface RewardResponse {
  statusCode: number
  data: {
    userCount: number
    pointsAwarded: number
    currentOwnerPoints: number
  }
}

interface PointsButtonProps {
  classroomId: string
}

export default function PointsButton({ classroomId }: PointsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { mutate, isPending } = useMutation<RewardResponse, Error, void>({
    mutationFn: async () => {
      return (await rewardOwner(classroomId)) as unknown as RewardResponse
    },
    onSuccess: res => {
      const { pointsAwarded, userCount } = res.data

      toast.success(
        `รับแต้มสำเร็จ! ได้รับ ${pointsAwarded} แต้ม (จากนักเรียนใหม่ ${userCount} คน)`,
      )
      setIsOpen(false)
    },
    onError: (error: any) => {
      const errorMsg =
        error?.response?.data?.message || 'เกิดข้อผิดพลาด ไม่สามารถรับแต้มได้'
      toast.error(errorMsg)
      console.error(error)
      setIsOpen(false)
    },
  })

  return (
    <>
      <div className="flex">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsOpen(true)}
        >
          + รับแต้มสะสม
        </button>
      </div>

      {isOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-all duration-200">
          <div className="animate-in zoom-in-95 w-full max-w-md scale-100 rounded-3xl bg-white p-6 shadow-2xl transition-all duration-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
              ⭐️
            </div>

            <h3 className="mb-2 text-center text-2xl font-extrabold text-gray-800">
              รับคะแนนสะสม
            </h3>

            <p className="mb-8 text-center leading-relaxed text-gray-600">
              ระบบจะคำนวณจำนวนนักเรียนที่เพิ่งเข้าร่วมห้องเรียนใหม่
              และแปลงเป็นคะแนนสะสมให้กับคุณ คุณต้องการรับคะแนนตอนนี้เลยหรือไม่?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="w-1/2 rounded-xl bg-gray-100 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                ไว้ทีหลัง
              </button>

              <button
                onClick={() => mutate()}
                disabled={isPending}
                className="flex w-1/2 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white transition-all hover:bg-primary/80 disabled:cursor-not-allowed disabled:bg-orange-400"
              >
                {isPending ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>กำลังประมวลผล...</span>
                  </>
                ) : (
                  'ยืนยันรับแต้ม'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
//TODO : bug
