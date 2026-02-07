import CopyCode from '@/components/Copy-code'
import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import NavbarContent from '@/components/NavbarContent'
import { getClassroom } from '@/services/classroom'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { HiUsers } from 'react-icons/hi2'
import { SiGoogleclassroom } from 'react-icons/si'
import { VscNotebook } from 'react-icons/vsc'

export default function ClassroomId() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const classroomId = router.query.id as string

  const { data: classroom } = useQuery({
    queryKey: ['getClassroom', classroomId],
    queryFn: () => getClassroom(classroomId),
    enabled: !!classroomId,
    refetchOnWindowFocus: false,
  })

  const uniqueUserCount = new Set((classroom?.users ?? []).map(u => u.user.id))
    .size

  return (
    <AppLayout>
      <DashboardLayout>
        <NavbarContent search={search} onSearch={setSearch} />

        <div className="mx-4 mt-8 flex flex-col rounded-md border bg-white shadow-sm sm:mx-4 sm:mt-4">
          <div className="flex w-full flex-col items-center justify-between gap-4 p-4 sm:flex-row sm:gap-0">
            <div className="flex flex-row items-center gap-3">
              <SiGoogleclassroom className="h-12 w-12 text-primary" />
              <div className="flex flex-col">
                <h1 className="text-xl font-bold">{classroom?.name}</h1>
                <p className="text-sm text-gray-400">{classroom?.title}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <CopyCode text={classroom?.code ?? ''} />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-8 p-4 sm:flex-row">
            <div className="flex h-24 w-80 flex-col rounded-xl border border-primary p-4 shadow-md sm:w-96">
              <div className="flex flex-row items-center gap-2">
                <SiGoogleclassroom className="h-5 w-5 text-primary" />
                <p className="text-sm">ห้องเรียนทั้งหมด</p>
              </div>
              <div className="ml-1 mt-2">
                <h1 className="text-xl font-bold text-primary">
                  {classroom ? 1 : 0}
                </h1>
              </div>
            </div>
            <div className="flex h-24 w-80 flex-col rounded-xl border border-[#fbc02d] p-4 shadow-md sm:w-96">
              <div className="flex flex-row items-center gap-2">
                <HiUsers className="h-5 w-5 text-[#fbc02d]" />
                <p className="text-sm">นักเรียนทั้งหมด</p>
              </div>
              <div className="ml-1 mt-2">
                <h1 className="text-xl font-bold text-[#fbc02d]">
                  {uniqueUserCount}
                </h1>
              </div>
            </div>
            <div className="flex h-24 w-80 flex-col rounded-xl border border-[#0a8f08] p-4 shadow-md sm:w-96">
              <div className="flex flex-row items-center gap-2">
                <VscNotebook className="h-5 w-5 text-[#0a8f08]" />
                <p className="text-sm">งานที่มอบหมายทั้งหมด</p>
              </div>
              <div className="ml-1 mt-2">
                <h1 className="text-xl font-bold text-[#0a8f08]">
                  {uniqueUserCount}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AppLayout>
  )
}
