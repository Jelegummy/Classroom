import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import {
  getAnswerHistory,
  approveSubmission,
  getAssignment,
} from '@/services/assignment'
import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import { FaArrowLeft } from 'react-icons/fa6'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { HiOutlineDocumentText } from 'react-icons/hi2'
import { RiRobot2Line } from 'react-icons/ri'
import { PiStudent } from 'react-icons/pi'

const PASS_THRESHOLD = 4

export default function SubmissionDetail() {
  const router = useRouter()
  const submissionId = router.query.submissionId as string
  const assignmentId = router.query.assignmentId as string
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['answerHistory', submissionId],
    queryFn: () => getAnswerHistory(submissionId),
    enabled: !!submissionId,
  })

  const { data: assignment } = useQuery({
    queryKey: ['getAssignment', assignmentId],
    queryFn: () => getAssignment(assignmentId),
    enabled: !!assignmentId,
  })

  const mySubmission = assignment?.classrooms
    ?.flatMap(c => c.submissions)
    ?.find(s => s.id === submissionId)

  const { mutate: approve, isPending } = useMutation({
    mutationFn: (isApproved: boolean) =>
      approveSubmission(submissionId, isApproved),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['answerHistory', submissionId],
      })
      queryClient.invalidateQueries({ queryKey: ['getSubmissions'] })
      router.back()
    },
  })

  if (isLoading)
    return <div className="h-32 animate-pulse rounded-lg bg-gray-100" />

  const history =
    (data?.answerHistory as {
      role: 'bot' | 'student'
      content: string
      is_correct?: boolean
    }[]) ?? []

  const score = history.filter(h => h.role === 'student' && h.is_correct).length
  const passed = score >= PASS_THRESHOLD

  return (
    <AppLayout>
      <DashboardLayout>
        <div className="mt-10 min-h-screen bg-[#F8FAFC] p-4 px-32">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            <FaArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </button>

          <div className="mb-4 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-500 p-2">
                <HiOutlineDocumentText className="size-8 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-semibold text-gray-800">
                  {data?.user?.firstName} {data?.user?.lastName}
                </h3>
                <p className="text-xs text-gray-400">
                  ส่งเมื่อ{' '}
                  {dayjs(mySubmission?.submittedAt)
                    .locale('th')
                    .format('D MMM YYYY HH:mm น.')}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {mySubmission?.isApproved ? (
                <span className="rounded-full px-2 py-0.5 text-xl text-green-600">
                  ยืนยันแล้ว
                </span>
              ) : (
                <span className="text-xl text-yellow-400">รอการยืนยัน</span>
              )}
              <p className="flex gap-2 text-sm text-gray-700">
                คะแนน {score} / 5 <span>{passed ? 'ผ่าน' : 'ไม่ผ่าน'}</span>
              </p>
            </div>
          </div>

          <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-800">
              ประวัติการตรวจการบ้าน
            </h2>
            <div className="flex flex-col gap-3">
              {history.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'bot' && (
                    <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                      <span className="text-xs text-white">
                        <RiRobot2Line className="size-4" />
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex flex-col gap-1 ${msg.role === 'student' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-sm rounded-xl px-4 py-2 text-sm ${
                        msg.role === 'bot'
                          ? 'bg-sky-100 text-gray-800'
                          : 'bg-amber-100 text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'student' && msg.is_correct !== undefined && (
                      <span
                        className={`text-xs font-medium ${msg.is_correct ? 'text-green-600' : 'text-red-500'}`}
                      >
                        {msg.is_correct ? '✓ ถูกต้อง' : '✗ ไม่ถูกต้อง'}
                      </span>
                    )}
                  </div>
                  {msg.role === 'student' && (
                    <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500">
                      <PiStudent className="size-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {mySubmission?.isApproved === false && (
            <div className="mb-10 flex justify-end gap-3">
              <button
                onClick={() => approve(false)}
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                ไม่ผ่าน
              </button>
              <button
                onClick={() => approve(true)}
                disabled={isPending}
                className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
              >
                ยืนยันการส่ง
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AppLayout>
  )
}
