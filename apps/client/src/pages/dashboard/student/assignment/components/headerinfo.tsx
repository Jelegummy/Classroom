import { getClassroom } from '@/services/classroom'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import React from 'react'
import { CiClock2 } from 'react-icons/ci'
import { HiOutlineDocumentText } from 'react-icons/hi2'
import { FaRegPenToSquare } from 'react-icons/fa6'
import { getAssignment } from '@/services/assignment'
import { useSession } from 'next-auth/react'

interface AssignmentHeadProps {
  assignmentId: string
}

export default function AssignmentHead({ assignmentId }: AssignmentHeadProps) {
  const router = useRouter()
  const { classroomId, cid } = router.query
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ''

  const { data: classroom } = useQuery({
    queryKey: ['getClassroom', classroomId],
    queryFn: () => getClassroom(classroomId as string),
    enabled: !!classroomId,
  })

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['getAssignment', assignmentId],
    queryFn: () => getAssignment(assignmentId),
    enabled: !!assignmentId,
  })

  const submissions = assignment?.classrooms?.[0]?.submissions ?? []
  const mySubmission = submissions.find(s => s.userId === userId)

  const status = !mySubmission
    ? { label: 'ยังไม่ส่ง', className: 'bg-gray-100 text-gray-600' }
    : !mySubmission.isApproved
      ? { label: 'รอดำเนินการ', className: 'bg-yellow-100 text-yellow-700' }
      : { label: 'ส่งแล้ว', className: 'bg-green-100 text-green-700' }

  const dueDate = assignment?.classrooms?.[0]?.dueDate
  const submittedCount = assignment?.classrooms?.[0]?.submissions?.length ?? 0
  const totalStudents = classroom?.users?.length ?? 0
  const isOverdue = dueDate && dayjs().isAfter(dayjs(dueDate))

  if (isLoading)
    return <div className="h-32 animate-pulse rounded-lg bg-gray-100" />

  if (!assignment?.id)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-600">
        ไม่พบข้อมูลงาน (ID: {assignmentId})
      </div>
    )

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4">
        <div className="flex justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-500 p-2">
              <HiOutlineDocumentText className="size-8 text-white" />
            </div>
            <div className="flex min-w-0 flex-col">
              <h3 className="text-2xl font-semibold text-gray-800">
                {assignment.title}
              </h3>
              <p className="text-base text-gray-500">{classroom?.name}</p>
            </div>
          </div>
          <div>{status.label}</div>
        </div>

        <div className="flex items-center justify-between">
          <p
            className={`flex items-center gap-1 text-sm ${
              !dueDate
                ? 'text-gray-600'
                : isOverdue
                  ? 'text-red-500'
                  : 'text-green-700'
            }`}
          >
            <CiClock2 className="size-5" />
            <span>กำหนดส่ง:</span>
            <span>
              {dueDate
                ? dayjs(dueDate).locale('th').format('DD MMM YYYY HH:mm น.')
                : 'ไม่มีกำหนด'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
