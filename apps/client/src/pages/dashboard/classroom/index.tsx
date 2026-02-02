import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import NavbarContent from '@/components/NavbarContent'
import { getAllClassrooms } from '@/services/classroom'
import { useQuery } from '@tanstack/react-query'
import CreateButton from './createBotton'
import { useState } from 'react'

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

  return (
    <AppLayout>
      <DashboardLayout>
        <NavbarContent search={search} onSearch={setSearch} />
        <div className="flex w-full items-center justify-between p-4">
          <h1 className="text-xl font-bold">ห้องเรียนของคุณ</h1>
          <div className="flex justify-end">
            <CreateButton />
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
