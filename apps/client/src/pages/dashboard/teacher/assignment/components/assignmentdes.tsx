import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import React, { useState, useEffect } from 'react'
import { FaRegFilePdf, FaRegPenToSquare } from 'react-icons/fa6'
import { HiOutlineDownload } from 'react-icons/hi'
import { getAssignment } from '@/services/assignment'

function AssignmentDescription() {
  const router = useRouter()
  const { id, cid } = router.query
  const [fileSize, setFileSize] = useState<string>('กำลังคำนวณ...')

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['getAssignment', id],
    queryFn: () => getAssignment(id as string),
    enabled: !!cid,
  })

  useEffect(() => {
    if (assignment?.filePdf) {
      fetch(assignment.filePdf, { method: 'HEAD' })
        .then(res => {
          const size = res.headers.get('content-length')
          if (size) {
            const kb = parseInt(size) / 1024
            setFileSize(
              kb > 1024
                ? `${(kb / 1024).toFixed(2)} MB`
                : `${kb.toFixed(2)} KB`,
            )
          } else {
            setFileSize('ไม่ทราบขนาด')
          }
        })
        .catch(() => setFileSize('ไม่ทราบขนาด'))
    }
  }, [assignment?.filePdf])

  if (isLoading)
    return <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
  if (!assignment) return <div className="p-5 text-red-600">ไม่พบข้อมูลงาน</div>

  const fileName = assignment.filePdf
    ? assignment.filePdf.split('/').pop()
    : 'ไม่มีไฟล์แนบ'

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="mb-2 text-xl font-bold text-gray-800">
            รายละเอียดงาน
          </h2>
          <button className="flex h-9 w-20 items-center justify-center rounded-md bg-blue-200 text-blue-600">
            <FaRegPenToSquare />
            แก้ไข
          </button>
        </div>
        <div className="grid gap-3">
          <p className="text-base text-gray-500">{assignment.description}</p>
          <div>
            <h3 className="text-sm font-semibold text-gray-500"></h3>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-stone-50 p-3 transition-colors">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                  <FaRegFilePdf size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="max-w-[200px] truncate font-medium text-gray-800 md:max-w-md">
                    {assignment.filePdf ? fileName : 'ไม่มีไฟล์แนบ'}
                  </span>
                  <span className="text-xs text-gray-400">{fileSize}</span>
                </div>
              </div>
              <a
                href={assignment.filePdf ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-lg border border-gray-300 p-2 text-sm font-medium hover:border-0 hover:bg-blue-500 hover:text-white"
              >
                <HiOutlineDownload className="size-5" />
                โหลดไฟล์
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-gray-800">คำถามในงานนี้</h2>
        <div className="grid gap-4">
          {assignment?.chatHistory?.map((chat, index) => (
            <div key={index} className="flex gap-2 rounded-md bg-gray-50 p-3">
              <p className="flex text-base text-gray-600">{index + 1}.</p>
              <p className="flex text-base text-gray-600">
                {chat.content}
              </p>{' '}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AssignmentDescription
