import { useState, useEffect } from 'react'
import { rewardStudent } from '@/services/classroom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { IoClose } from 'react-icons/io5'
import { IoAddOutline } from 'react-icons/io5'
import { RankingProps, SelectedStudent } from '../types'

export default function Ranking({
  classroomId,
  studentIds,
  points,
  names,
  roles,
}: RankingProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent>(null)
  const [pointsInput, setPointsInput] = useState('')

  const [usersData, setUsersData] = useState(() =>
    points
      .map((pt, i) => ({
        id: studentIds[i] ?? '',
        point: pt,
        name: names[i] ?? 'Unknown',
        role: roles[i] ?? 'STUDENT',
      }))
      .filter(user => user.role !== 'TEACHER'),
  )

  useEffect(() => {
    setUsersData(
      points
        .map((pt, i) => ({
          id: studentIds[i] ?? '',
          point: pt,
          name: names[i] ?? 'Unknown',
          role: roles[i] ?? 'STUDENT',
        }))
        .filter(user => user.role !== 'TEACHER'),
    )
  }, [points, studentIds, names, roles])

  const rewardMutation = useMutation({
    mutationFn: ({
      studentId,
      amount,
    }: {
      studentId: string
      amount: number
    }) => rewardStudent(classroomId, studentId, amount),
    onSuccess: (_, variables) => {
      setUsersData(prev =>
        prev.map(user =>
          user.id === variables.studentId
            ? { ...user, point: user.point + variables.amount }
            : user,
        ),
      )

      setIsDialogOpen(false)
      setPointsInput('')
      toast.success('ให้คะแนนสำเร็จ!')
    },
    onError: error => {
      console.error(error)
      toast.error('เกิดข้อผิดพลาดในการให้คะแนน')
    },
  })

  const sortedUsers = [...usersData].sort((a, b) => b.point - a.point)

  const top3 = sortedUsers.slice(0, 3)
  const rest = sortedUsers.slice(3)

  const podiumOrder = [1, 0, 2]

  const handleOpenDialog = (user: {
    id: string
    name: string
    point: number
  }) => {
    setSelectedStudent(user)
    setPointsInput('')
    setIsDialogOpen(true)
  }

  const handleSubmitReward = () => {
    const amount = Number(pointsInput)
    if (amount > 0 && selectedStudent) {
      rewardMutation.mutate({ studentId: selectedStudent.id, amount })
    } else {
      toast.error('กรุณากรอกคะแนนที่มากกว่า 0')
    }
  }

  return (
    <div className="relative mx-auto mt-2 max-w-4xl space-y-6 p-4 md:mt-5 md:space-y-8 md:p-6">
      <div className="flex items-end justify-center gap-2 md:gap-6">
        {podiumOrder.map(i => {
          const user = top3[i]
          if (!user) return null

          const isFirst = i === 0

          return (
            <div
              key={i}
              onClick={() => handleOpenDialog(user)}
              className={`flex w-[30%] cursor-pointer flex-col items-center rounded-lg border p-2 text-center shadow transition-transform duration-300 md:w-56 md:rounded-xl md:p-6 ${
                isFirst
                  ? '-translate-y-4 border-orange-400 bg-orange-50 hover:-translate-y-6 md:-translate-y-8 md:hover:-translate-y-10'
                  : '-translate-y-1 border-gray-200 bg-white hover:-translate-y-2 md:-translate-y-2 md:hover:-translate-y-4'
              } `}
            >
              {isFirst && (
                <div className="mb-1 text-sm md:mb-2 md:text-2xl">👑</div>
              )}

              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name.trim() || 'User',
                )}&background=random`}
                alt="Profile"
                className="mb-1 h-8 w-8 rounded-full border-2 border-white bg-gray-200 object-cover shadow-sm md:mb-3 md:h-14 md:w-14"
              />

              <p
                className={`text-xs font-bold md:text-lg ${
                  isFirst ? 'text-orange-500' : 'text-blue-500'
                }`}
              >
                {user.point} Pt
              </p>

              <p className="line-clamp-1 w-full text-[10px] font-semibold md:text-base">
                {user.name}
              </p>

              <p className="mt-2 hidden text-xs text-gray-400 opacity-0 transition-opacity hover:opacity-100 md:block">
                คลิกเพื่อให้คะแนน
              </p>
            </div>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {rest.map((user, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b p-3 last:border-none md:p-4"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs md:h-8 md:w-8 md:text-sm">
                {index + 4}
              </span>

              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name.trim() || 'User',
                )}&background=random`}
                alt="Profile"
                className="h-8 w-8 rounded-full bg-gray-200 object-cover md:h-10 md:w-10"
              />

              <div>
                <p className="text-sm font-medium md:text-base">{user.name}</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-600 md:text-base">
              {user.point} Pt
            </p>
          </div>
        ))}
      </div>

      {isDialogOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in relative w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl duration-200 md:w-80">
            <div className="relative z-10 h-20 w-full bg-blue-500 md:h-24 md:bg-primary">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="absolute right-3 top-3 text-white/80 transition-colors hover:text-white"
              >
                <IoClose className="h-6 w-6 md:h-7 md:w-7" />
              </button>
            </div>

            <div className="relative z-20 -mt-10 flex justify-center md:-mt-12">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  selectedStudent.name.trim() || 'User',
                )}&background=random`}
                alt="Profile"
                className="h-20 w-20 rounded-full border-4 border-white bg-gray-200 object-cover shadow-md md:h-24 md:w-24"
              />
            </div>

            <div className="space-y-2 p-5 pt-2 text-center md:space-y-3 md:p-6">
              <h3 className="text-lg font-bold text-gray-800 md:text-xl">
                {selectedStudent.name}
              </h3>
              <p className="text-base font-semibold text-blue-500 md:text-lg">
                {selectedStudent.point} Pt
              </p>

              <div className="pt-2 text-left">
                <label className="mb-1 block text-xs text-gray-500 md:text-sm">
                  เพิ่มพอยต์
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="กรอกคะแนน"
                    value={pointsInput}
                    onChange={e => setPointsInput(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 md:py-2"
                    disabled={rewardMutation.isPending}
                  />
                  <button
                    onClick={handleSubmitReward}
                    disabled={rewardMutation.isPending || !pointsInput}
                    className="flex items-center justify-center rounded-lg bg-blue-500 px-3 py-1.5 text-white shadow-sm transition-colors hover:bg-blue-600 disabled:bg-gray-300 md:px-4 md:py-2"
                  >
                    {rewardMutation.isPending ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent md:h-5 md:w-5"></span>
                    ) : (
                      <IoAddOutline className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
