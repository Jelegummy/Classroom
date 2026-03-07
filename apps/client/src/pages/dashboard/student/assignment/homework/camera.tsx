import React, { useState } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import { FaArrowLeft } from 'react-icons/fa6'
import OpenCam from '../components/opencam'

export default function Opencampage() {
  const router = useRouter()
  const { id, classroomId, cid } = router.query

  return (
    <AppLayout>
      <DashboardLayout>
        <div className="px-40 py-10">
          <button
            onClick={() =>
              router.push({
                pathname: `/dashboard/student/assignment/${id}`,
                query: { classroomId, cid },
              })
            }
            className="flex items-center gap-2 pb-5 text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            <FaArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </button>
          <div className="grid w-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex justify-center bg-white p-3">
              <OpenCam />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AppLayout>
  )
}
