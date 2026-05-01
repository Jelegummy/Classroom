'use client'
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSubmissionDetail } from '@/services/assignment'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { RiRobot2Line } from 'react-icons/ri'
import { IoShareSocial, IoShareSocialOutline } from 'react-icons/io5'

import { PiStudent } from 'react-icons/pi'
import { useRouter } from 'next/navigation'

interface Props {
  submissionId: string
}

export default function SendhomeWorkhistory({ submissionId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['answerHistory', submissionId],
    queryFn: () => getSubmissionDetail(submissionId),
    enabled: !!submissionId,
  })
  const router = useRouter()

  if (isLoading)
    return <div className="h-32 animate-pulse rounded-lg bg-gray-100" />

  const sendhistory = (data?.answerHistory ?? []) as {
    role: 'bot' | 'student'
    content: string
    is_correct?: boolean
  }[]

  const handleBack = () => {
    router.push(`/dashboard/student/assignment/history/${submissionId}`)
  }
  return (
    <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex justify-between">
        <h2 className="mb-4 text-xl font-bold text-gray-800">
          ประวัติการตรวจการบ้าน
        </h2>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-black bg-white p-2 duration-300 hover:border-blue-600 hover:text-blue-600"
          onClick={handleBack}
        >
          <IoShareSocial className="size-4" />
        </button>
      </div>
      <div className="flex flex-col gap-3 px-2">
        {sendhistory.map((msg, index) => (
          <div
            key={index}
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
          </div>
        ))}
      </div>
    </div>
  )
}
