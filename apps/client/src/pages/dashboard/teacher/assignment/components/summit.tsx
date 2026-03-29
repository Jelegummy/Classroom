import React from 'react'
import { getSubmissionsByAssignment } from '@/services/assignment'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

const PASS_THRESHOLD = 4

function AssignmentSummit() {
  const router = useRouter()
  const assignmentId = router.query.id as string
  const classroomId = router.query.classroomId as string
  // console.log(router.query)

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['getSubmissions', assignmentId, classroomId],
    queryFn: () => getSubmissionsByAssignment(assignmentId, classroomId),
    enabled: !!assignmentId && !!classroomId,
  })

  if (isLoading)
    return <div className="h-32 animate-pulse rounded-lg bg-gray-100" />

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">การส่งงานทั้งหมด</h2>
      {!submissions?.length ? (
        <p className="text-gray-500">ยังไม่มีการส่งงานจากนักเรียน</p>
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map(submission => {
            const statusLabel = !submission.isApproved
              ? { label: 'รอการยืนยัน', className: 'text-yellow-600' }
              : { label: 'ผ่านการตรวจแล้ว', className: 'text-green-600' }
            return (
              <div
                key={submission.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                    {submission.user.firstName?.[0]}
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium text-gray-800">
                      {submission.user.firstName} {submission.user.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {dayjs(submission.submittedAt)
                        .locale('th')
                        .format('D MMM YYYY HH:mm น.')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className={`text-sm font-medium ${statusLabel.className}`}>
                    {statusLabel.label}
                  </p>
                  <button
                    onClick={() =>
                      router.push({
                        pathname: `/dashboard/teacher/assignment/checksubmission/viewsummitdetail`,
                        query: {
                          submissionId: submission.id,
                          assignmentId,
                          classroomId,
                        },
                      })
                    }
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  >
                    ดูรายละเอียด
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AssignmentSummit
