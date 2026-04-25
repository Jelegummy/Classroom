import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import React from 'react'
import { FaArrowLeft } from 'react-icons/fa6'
import { RiRobot2Line } from 'react-icons/ri'
import { getSubmissionDetail } from '@/services/assignment'
import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'

function HistorySubmission() {
  const router = useRouter()
  if (!router.isReady) return null

  const submissionId = router.query.id as string

  const { data, isLoading } = useQuery({
    queryKey: ['answerHistory', submissionId],
    queryFn: () => getSubmissionDetail(submissionId),
    enabled: !!submissionId,
  })

  if (isLoading)
    return <div className="h-32 animate-pulse rounded-lg bg-gray-100" />

  const answerHistory = (data?.answerHistory ?? []) as {
    role: 'bot' | 'student'
    content: string
    is_correct?: boolean
  }[]

  const studentName = data?.user
    ? `${data.user.firstName} ${data.user.lastName ?? ''}`.trim()
    : ''

  return (
    <AppLayout>
      <DashboardLayout>
        <div className="mt-10 min-h-screen bg-[#F8FAFC] p-4 px-32">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <FaArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </button>

          <div className="mt-4 max-w-full">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    ประวัติการตรวจการบ้าน
                  </h2>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                  }}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:border-blue-500 hover:text-blue-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 10h6a2 2 0 002-2v-8a2 2 0 00-2-2h-6a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  คัดลอกลิงก์
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {answerHistory.length === 0 && (
                  <p className="text-center text-sm text-gray-400">
                    ไม่มีประวัติการตอบ
                  </p>
                )}
                {answerHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'bot' && (
                      <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600">
                        <RiRobot2Line className="size-4 text-white" />
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
                      {msg.role === 'student' &&
                        msg.is_correct !== undefined && (
                          <span
                            className={`text-xs font-medium ${
                              msg.is_correct ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            {msg.is_correct ? '✓ ถูกต้อง' : '✗ ไม่ถูกต้อง'}
                          </span>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AppLayout>
  )
}

export default HistorySubmission
