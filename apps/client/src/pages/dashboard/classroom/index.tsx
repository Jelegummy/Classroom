import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import NavbarContent from '@/components/NavbarContent'
import { getAllClassrooms } from '@/services/classroom'
import { useQuery } from '@tanstack/react-query'
import CreateButton from './createBotton'
import { useState } from 'react'
import { SiGoogleclassroom } from 'react-icons/si'
import { HiUsers } from 'react-icons/hi2'
import { VscNotebook } from 'react-icons/vsc'

export default function Page() {
  const [search, setSearch] = useState('')

  const { data: classrooms } = useQuery({
    queryKey: ['getAllClassrooms', search],
    queryFn: () => getAllClassrooms(),
    refetchOnWindowFocus: false,
  })

  const filteredClassrooms = classrooms?.filter(classroom =>
    classroom.name.toLowerCase().includes(search.toLowerCase()),
  )

  const uniqueUserCount = new Set(
    classrooms?.flatMap(c => c.users.map(u => u.user.id)),
  ).size

  return (
    <AppLayout>
      <DashboardLayout>
        <NavbarContent search={search} onSearch={setSearch} />
        <div className="mx-4 mt-4 flex flex-col rounded-md border bg-white shadow-sm">
          <div className="flex w-full items-center justify-between p-4">
            <div className="flex flex-row items-center gap-3">
              <SiGoogleclassroom className="h-12 w-12 text-primary" />
              <div className="flex flex-col">
                <h1 className="text-xl font-bold">ห้องเรียน</h1>
                <p className="text-sm text-gray-400">
                  สามารถดูห้องเรียนของคุณได้ที่นี่
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <CreateButton />
            </div>
          </div>
          <div className="flex flex-row items-center justify-center gap-8 p-4">
            <div className="flex h-24 w-96 flex-col rounded-xl border border-primary p-4 shadow-md">
              <div className="flex flex-row items-center gap-2">
                <SiGoogleclassroom className="h-5 w-5 text-primary" />
                <p className="text-sm">ห้องเรียนทั้งหมด</p>
              </div>
              <div className="ml-1 mt-2">
                <h1 className="text-xl font-bold text-primary">
                  {classrooms?.length}
                </h1>
              </div>
            </div>
            <div className="flex h-24 w-96 flex-col rounded-xl border border-[#fbc02d] p-4 shadow-md">
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
            <div className="flex h-24 w-96 flex-col rounded-xl border border-[#0a8f08] p-4 shadow-md">
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

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredClassrooms?.map(classroom => (
            <div
              key={classroom.id}
              className="card bg-[url('/classroom-bg.jpg')] shadow-md"
            >
              <div className="card h-full bg-[url('/classroom-bg.jpg')] shadow-md">
                <div className="card-body flex flex-col">
                  <h2 className="card-title text-xl">{classroom.name}</h2>
                  <p className="text-sm text-black">
                    {classroom.users
                      .filter(u => u.user.role === 'TEACHER')
                      .map(u => `${u.user.firstName} ${u.user.lastName}`)
                      .join(', ')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    </AppLayout>
  )
}
