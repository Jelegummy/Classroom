import { getAllAssignments } from '@/services/assignment'
import { getClassroom } from '@/services/classroom'
import { useQuery } from '@tanstack/react-query'
import { UsersRound } from 'lucide-react'
import Link from 'next/link'
import { CiClock2 } from 'react-icons/ci'
import { HiOutlineDocumentText } from 'react-icons/hi2'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import { useSession } from 'next-auth/react'
import type { GetAssignmentsByClassroomResponse } from '@/services/assignment/types'

type Mode = 'all' | 'pending' | 'overdue' | 'submitted'

interface AssignmentTaskProps {
  classroomId: string
  mode: Mode
}

export default function AssignmentTaskStudent({
  classroomId,
  mode,
}: AssignmentTaskProps) {
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ''

  const { data: classroom, isLoading: isClassroomLoading } = useQuery({
    queryKey: ['getClassroom', classroomId],
    queryFn: () => getClassroom(classroomId),
    enabled: !!classroomId,
    refetchOnWindowFocus: false,
  })
  console.log('classroomId prop:', classroomId)

  const { data: assignments, isLoading: isAssignmentsLoading } = useQuery({
    queryKey: ['getAllAssignments', classroomId],
    queryFn: () => getAllAssignments({ classroomId }),
    enabled: !!classroomId,
    refetchOnWindowFocus: false,
  })

  if (isAssignmentsLoading || isClassroomLoading) {
    return <div className="p-4">กำลังโหลดงาน...</div>
  }

  const totalStudents = classroom?.users?.length ?? 0

  const assignmentList: GetAssignmentsByClassroomResponse[] = assignments ?? []

  const filtered = assignmentList.filter(assignment => {
    const dueDate = assignment.classrooms?.[0]?.dueDate
    const submissions = assignment.classrooms?.[0]?.submissions ?? []
    const isSubmitted = submissions.some(s => s.userId === userId)
    const isOverdue = dueDate && dayjs().isAfter(dayjs(dueDate))

    if (mode === 'all') return true
    if (mode === 'submitted') return isSubmitted
    if (mode === 'overdue') return !isSubmitted && isOverdue
    if (mode === 'pending') return !isSubmitted && !isOverdue
    return true
  })

  return (
    <div className="mx-auto grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filtered.length > 0 ? (
        filtered.map(assignment => {
          const classroomData = assignment.classrooms?.[0]
          const dueDate = classroomData?.dueDate
          const submissions = classroomData?.submissions ?? []
          const submittedCount = submissions.length

          const isOverdue = dueDate && dayjs().isAfter(dayjs(dueDate))

          return (
            <Link
              key={assignment.id}
              href={`/dashboard/student/assignment/${assignment.id}`}
              className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="shrink-0 rounded-md bg-blue-100 p-2">
                    <HiOutlineDocumentText className="size-7 text-blue-500" />
                  </div>

                  <div className="flex min-w-0 flex-col">
                    <h3 className="truncate text-lg font-semibold">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-500">{classroom?.name}</p>
                  </div>
                </div>

                <div
                  className={`flex h-6 items-center rounded-full px-3 text-xs font-medium ${
                    !dueDate
                      ? 'bg-gray-100 text-gray-600'
                      : isOverdue
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  {!dueDate
                    ? 'ไม่มีกำหนด'
                    : isOverdue
                      ? 'ครบกำหนดส่งแล้ว'
                      : 'ยังไม่ครบกำหนดส่ง'}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <UsersRound className="size-4" />
                    <p className="text-sm">ส่งแล้ว</p>
                  </div>

                  <p className="text-sm font-medium">
                    {submittedCount} / {totalStudents - 1}
                  </p>
                </div>

                <hr className="border-gray-200" />
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
                      ? dayjs(dueDate)
                          .locale('th')
                          .format('DD MMM YYYY HH:mm น.')
                      : 'ไม่มีกำหนด'}
                  </span>
                </p>
              </div>
            </Link>
          )
        })
      ) : (
        <div className="col-span-full py-10 text-center text-gray-400">
          {mode === 'submitted'
            ? 'ไม่พบงานที่ส่งแล้ว'
            : mode === 'overdue'
              ? 'ไม่พบงานที่ครบกำหนดส่งแล้ว'
              : mode === 'pending'
                ? 'ยังไม่มีงานที่รอดำเนินการ'
                : 'ยังไม่มีการมอบหมายงานในห้องเรียนนี้'}
        </div>
      )}
    </div>
  )
}
