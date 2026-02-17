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
import CreateButtonAnnounce from './components/create-button-announce'
import MainTasks from './components/main-tasks'
import Ranking from './components/ranking'
import Link from 'next/link'
import InfoGame from './components/info-game'
import Image from 'next/image'
import PointsButton from './components/points-button'
import NavbarPoints from '@/components/NavbarContent/navbarPoints'

export default function ClassroomId() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<
    'main_tabs' | 'jobs_tabs' | 'game_tabs' | 'tutor_tabs' | 'people_tabs'
  >('main_tabs')
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
        <NavbarPoints classroomId={classroomId} />
        {/* fix navbar to search anything in classroom not name of classroom */}
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
        <div className="mt-3 flex flex-col p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between">
            <div className="tabs-box tabs flex flex-col gap-2 rounded-lg border bg-base-100 p-1 sm:flex-row">
              <input
                type="radio"
                name="main_tabs"
                aria-label="หน้าหลัก"
                className="tab border-transparent text-sm checked:rounded-none checked:bg-primary checked:text-white"
                checked={activeTab === 'main_tabs'}
                onChange={() => setActiveTab('main_tabs')}
              />

              <input
                type="radio"
                name="jobs_tabs"
                aria-label="งานของชั้นเรียน"
                className="tab border-transparent text-sm checked:rounded-none checked:bg-primary checked:text-white"
                checked={activeTab === 'jobs_tabs'}
                onChange={() => setActiveTab('jobs_tabs')}
              />

              <input
                type="radio"
                name="game_tabs"
                aria-label="เกมเช็คชื่อ"
                className="tab border-transparent text-sm checked:rounded-none checked:bg-primary checked:text-white"
                checked={activeTab === 'game_tabs'}
                onChange={() => setActiveTab('game_tabs')}
              />
              <input
                type="radio"
                name="tutor_tabs"
                aria-label="การติว"
                className="tab border-transparent text-sm checked:rounded-none checked:bg-primary checked:text-white"
                checked={activeTab === 'tutor_tabs'}
                onChange={() => setActiveTab('tutor_tabs')}
              />
              <input
                type="radio"
                name="people_tabs"
                aria-label="ผู้คนในชั้นเรียน"
                className="tab border-transparent text-sm checked:rounded-none checked:bg-primary checked:text-white"
                checked={activeTab === 'people_tabs'}
                onChange={() => setActiveTab('people_tabs')}
              />
            </div>

            <div className="mt-3 flex sm:mt-0">
              {activeTab === 'main_tabs' && (
                <div>
                  <CreateButtonAnnounce classroomId={classroom?.id ?? ''} />
                </div>
              )}
              {activeTab === 'jobs_tabs' && <div>button create job</div>}
              {activeTab === 'tutor_tabs' && <div>button create tutor</div>}
              {activeTab === 'people_tabs' && (
                <PointsButton classroomId={classroom?.id ?? ''} />
              )}
            </div>
          </div>
          <hr className="mt-3" />
          <div className="p-4">
            {activeTab === 'main_tabs' && (
              <MainTasks
                announcesId={classroom?.announces.map(a => a.id) ?? []}
              />
            )}
            {activeTab === 'jobs_tabs' && <div>make components jobs</div>}
            {/* connect model aong */}
            {activeTab === 'game_tabs' && (
              <>
                <Link
                  href={{
                    pathname: '/session/game',
                    query: { classroomId: classroom?.id },
                  }}
                  className="group block w-[300px]"
                >
                  <div className="relative overflow-hidden rounded-3xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <Image
                      src="/game-bg.jpg"
                      alt="Create Game"
                      width={300}
                      height={200}
                      className="h-[190px] w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    <div className="absolute bottom-0 w-full p-6 text-white">
                      <h2 className="text-2xl font-extrabold tracking-wide">
                        สร้างเกมเช็คชื่อ
                      </h2>
                      <p className="mt-1 text-sm text-gray-200">
                        สร้างเกมสนุกๆ เพื่อเพิ่มความสนุกในชั้นเรียน
                      </p>
                    </div>
                  </div>
                </Link>
                <hr className="mt-5" />
                <InfoGame classroomId={classroom?.id ?? ''} />
              </>
            )}
            {activeTab === 'tutor_tabs' && <div>make components tutor</div>}
            {/* connect model jee */}
            {activeTab === 'people_tabs' && (
              <Ranking
                points={classroom?.users.map(u => u.user.points) ?? []}
                names={
                  classroom?.users.map(
                    u => `${u.user.firstName} ${u.user.lastName}`,
                  ) ?? []
                }
                roles={classroom?.users.map(u => u.user.role) ?? []}
              />
            )}
          </div>
        </div>
      </DashboardLayout>
    </AppLayout>
  )
}
