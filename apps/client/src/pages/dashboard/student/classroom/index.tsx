import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import NavbarContent from '@/components/NavbarContent'
import { getAllClassrooms } from '@/services/classroom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { SiGoogleclassroom } from 'react-icons/si'
import { HiUsers } from 'react-icons/hi2'
import { VscNotebook } from 'react-icons/vsc'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import JoinButton from './components/join-button'

export default function Page() {
  const [search, setSearch] = useState('')
  const { data: session } = useSession()

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
        <div className="mx-4 mt-8 flex flex-col rounded-md border bg-white shadow-sm sm:mx-4 sm:mt-4">
          <div className="flex w-full flex-col items-center justify-between gap-4 p-4 sm:flex-row sm:gap-0">
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
              <JoinButton />
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
                  {classrooms?.length}
                </h1>
              </div>
            </div>
            <div className="flex h-24 w-80 flex-col rounded-xl border border-[#fbc02d] p-4 shadow-md sm:w-96">
              <div className="flex flex-row items-center gap-2">
                <HiUsers className="h-5 w-5 text-[#fbc02d]" />
                <p className="text-sm">ผู้ใช้ทั้งหมด</p>
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
        <div className="mt-5 grid grid-cols-1 gap-6 p-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredClassrooms?.map(classroom => (
            <Link
              key={classroom.id}
              href={`/dashboard/student/classroom/${classroom.id}`}
            >
              <div
                key={classroom.id}
                className="card w-96 overflow-hidden rounded-xl bg-base-100 shadow-md transition hover:shadow-lg"
              >
                <div
                  className="relative h-28 bg-cover bg-center"
                  style={{
                    backgroundImage: "url('/classroom-bg.jpg')",
                  }}
                >
                  <div className="relative z-10 p-4 text-black">
                    <h2 className="line-clamp-2 text-lg font-semibold">
                      {classroom.name}
                    </h2>
                    <p className="mt-1 text-sm opacity-90">
                      {classroom.users
                        .filter(u => u.user.role === 'TEACHER')
                        .map(u => `${u.user.firstName} ${u.user.lastName}`)
                        .join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex h-12 flex-col p-4">
                  {session?.user?.role === 'STUDENT' && (
                    <div className="flex items-center justify-end text-sm text-gray-500">
                      {/* ยังไม่ได้เชื่อม api update ไม่รู้จะ update อะไรบ้าง Design มา */}
                      นักเรียน
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </DashboardLayout>
    </AppLayout>
  )
}
