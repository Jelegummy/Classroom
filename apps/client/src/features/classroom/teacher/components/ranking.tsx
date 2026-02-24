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
    <div className="relative mx-auto mt-5 max-w-4xl space-y-8 p-6">
      <div className="flex items-end justify-center gap-6">
        {podiumOrder.map(i => {
          const user = top3[i]
          if (!user) return null

          const isFirst = i === 0

          return (
            <div
              key={i}
              onClick={() => handleOpenDialog(user)}
              className={`flex w-56 cursor-pointer flex-col items-center rounded-xl border p-6 text-center shadow transition-transform duration-300 ${
                isFirst
                  ? '-translate-y-8 border-orange-400 bg-orange-50 hover:-translate-y-10'
                  : '-translate-y-2 border-gray-200 bg-white hover:-translate-y-4'
              } `}
            >
              {isFirst && <div className="mb-2 text-2xl">👑</div>}

              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name.trim() || 'User',
                )}&background=random`}
                alt="Profile"
                className="mb-3 h-14 w-14 rounded-full border-2 border-white bg-gray-200 object-cover shadow-sm"
              />

              <p
                className={`text-lg font-bold ${
                  isFirst ? 'text-orange-500' : 'text-blue-500'
                }`}
              >
                {user.point} Pt
              </p>

              <p className="font-semibold">{user.name}</p>

              <p className="mt-2 text-xs text-gray-400 opacity-0 transition-opacity hover:opacity-100">
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
            className="flex items-center justify-between border-b p-4 last:border-none"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-sm">
                {index + 4}
              </span>

              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name.trim() || 'User',
                )}&background=random`}
                alt="Profile"
                className="h-10 w-10 rounded-full bg-gray-200 object-cover"
              />

              <div>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>

            <p className="font-semibold text-gray-600">{user.point} Pt</p>
          </div>
        ))}
      </div>

      {isDialogOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in relative w-80 overflow-hidden rounded-2xl bg-white shadow-2xl duration-200">
            <div className="relative z-10 h-24 w-full bg-primary">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="absolute right-3 top-3 text-white/80 transition-colors hover:text-white"
              >
                <IoClose className="h-7 w-7" />
              </button>
            </div>

            <div className="relative z-20 -mt-12 flex justify-center">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  selectedStudent.name.trim() || 'User',
                )}&background=random`}
                alt="Profile"
                className="h-24 w-24 rounded-full border-4 border-white bg-gray-200 object-cover shadow-md"
              />
            </div>

            <div className="space-y-3 p-6 pt-2 text-center">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedStudent.name}
              </h3>
              <p className="text-lg font-semibold text-blue-500">
                {selectedStudent.point} Pt
              </p>

              <div className="pt-2 text-left">
                <label className="mb-1 block text-sm text-gray-500">
                  เพิ่มพอยต์
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="กรอกคะแนน"
                    value={pointsInput}
                    onChange={e => setPointsInput(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={rewardMutation.isPending}
                  />
                  <button
                    onClick={handleSubmitReward}
                    disabled={rewardMutation.isPending || !pointsInput}
                    className="flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-white shadow-sm transition-colors hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    {rewardMutation.isPending ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    ) : (
                      <IoAddOutline className="h-5 w-5" />
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
