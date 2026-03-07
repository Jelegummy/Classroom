import React from 'react'
import { getSubmissionsByAssignment } from '@/services/assignment'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'

function AssignmentSummit() {
  const router = useRouter()
  const { classroomId, cid } = router.query

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['getSubmissions', cid],
    queryFn: () =>
      getSubmissionsByAssignment(cid as string, classroomId as string),
    enabled: !!cid && !!classroomId,
  })

  return (
    <div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">รายชื่อการส่งงาน</h2>
        {submissions?.length === 0 ? (
          <div>
            <p className="text-gray-500">ยังไม่มีการส่งงานจากนักเรียน</p>
          </div>
        ) : (
          submissions?.map(submission => (
            <div className="" key={submission.id}>
              <p>
                {submission.user.firstName} {submission.user.lastName}
              </p>
              <p>{submission.isApproved ? 'ยืนยันแล้ว' : 'รอดำเนินการ'}</p>
              <p>คะแนน: {submission.score ?? '-'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AssignmentSummit
