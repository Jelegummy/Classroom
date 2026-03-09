import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import NavbarContent from '@/components/NavbarContent'
import CreateCharacter from '@/features/character/components/create-character'
import DeleteCharacter from '@/features/character/components/delete-character'
import { getAllCharacters } from '@/services/charecter'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { useState } from 'react'
import { FiInbox, FiLoader } from 'react-icons/fi'
import { SiNodemon } from 'react-icons/si'

export default function Characters() {
  const [search, setSearch] = useState('')
  const { data: character, isLoading } = useQuery({
    queryKey: ['character'],
    queryFn: () => getAllCharacters(),
    refetchInterval: 2000,
    refetchOnWindowFocus: false,
  })

  const filteredItems =
    character?.filter(c =>
      c?.bossName?.toLowerCase().includes(search.toLowerCase()),
    ) || []

  return (
    <AppLayout>
      <DashboardLayout>
        <NavbarContent
          search={search}
          onSearch={setSearch}
          placeholder="ค้นหาตัวละคร..."
        />
        <div className="mx-4 mt-8 flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm sm:mx-8 sm:mt-8">
          <div className="flex w-full flex-col items-center justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white p-6 sm:flex-row sm:gap-0">
            <div className="flex flex-row items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
                <SiNodemon className="h-8 w-8" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                  ตัวละครในเกม
                </h1>
                <p className="text-sm font-medium text-slate-500">
                  จัดการและดูรายละเอียดตัวละครทั้งหมดของคุณได้ที่นี่
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <CreateCharacter />
            </div>
          </div>

          <div className="bg-slate-50 p-6">
            {isLoading ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center text-slate-400">
                <FiLoader className="h-8 w-8 animate-spin" />
                <p className="mt-4 text-sm font-medium">
                  กำลังโหลดข้อมูลตัวละคร...
                </p>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map((c, index) => (
                  <div
                    key={c.id || index}
                    className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md"
                  >
                    <div className="group relative">
                      <div className="absolute right-2 top-2 z-10">
                        <DeleteCharacter
                          id={c.id}
                          bossName={c.bossName || 'ชื่อตัวละครไม่ระบุ'}
                        />
                      </div>
                      <Image
                        src={c.imageUrl || '/default-character-image.png'}
                        alt={c.bossName || 'ชื่อตัวละคร'}
                        width={100}
                        height={100}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col p-4">
                      {/* <div className="mb-2 flex items-center justify-between">
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                          เลือด {c.maxHp || 'อุปกรณ์'} HP
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          จำนวนเวลา:{' '}
                          {c.timeLimit
                            ? `${c.timeLimit} วินาที`
                            : 'ไม่จำกัดเวลา'}
                        </span>
                      </div> */}
                      <h3 className="line-clamp-1 text-lg font-bold text-slate-800">
                        {c.bossName || 'ชื่อไอเทม'}
                      </h3>
                      {/* <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {c.description || 'ไม่มีคำอธิบายสำหรับไอเทมชิ้นนี้'}
                      </p> */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white text-slate-400">
                <FiInbox className="h-12 w-12 text-slate-300" />
                <p className="mt-4 text-base font-semibold text-slate-600">
                  ไม่พบไอเทม
                </p>
                <p className="text-sm">
                  ลองค้นหาด้วยคำอื่น หรือเพิ่มไอเทมใหม่ดูสิ
                </p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AppLayout>
  )
}
