import { useState } from 'react'
import { getTutorContentById, getTutorContentUserById } from '@/services/tutor'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import { FaArrowLeft } from 'react-icons/fa'
import { PaginationDemo } from '@/features/pagination'
import { MonitorPlay } from 'lucide-react'

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

export default function Content() {
  const router = useRouter()

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 1

  const tutorId = router.query.id as string

  const { data: contents, isLoading: isContentLoading } = useQuery({
    queryKey: ['getTutorContentById', tutorId],
    queryFn: () => getTutorContentById(tutorId),
    enabled: !!tutorId,
  })

  const { data: contentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ['getTutorContentUserById', tutorId],
    queryFn: () => getTutorContentUserById(tutorId),
    enabled: !!tutorId,
  })

  if (!router.isReady) return null

  const totalItems = contents?.length || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1

  const currentContents = contents?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  return (
    <AppLayout>
      <DashboardLayout>
        {isContentLoading || isUserLoading ? (
          <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-400">
              <MonitorPlay size={48} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              กำลังโหลดข้อมูล...
            </h3>
          </div>
        ) : !contents || contents.length === 0 ? (
          <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-400">
              <MonitorPlay size={48} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              ยังไม่มีข้อมูลการติวในขณะนี้
            </h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              โปรดตรวจสอบอีกครั้งในภายหลัง
            </p>
          </div>
        ) : (
          <div className="mt-10 min-h-screen bg-[#F8FAFC] p-4 md:p-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 sm:px-32"
            >
              <FaArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </button>

            <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-6">
              {currentContents?.map((content: any) => {
                const roles = content.dataContent?.roles
                const sessionUsers: Array<{
                  fullName: string
                  score: number
                  roleLabel: string
                }> = []

                if (roles) {
                  if (roles.main_speaker) {
                    sessionUsers.push({
                      fullName: roles.main_speaker,
                      score: 5,
                      roleLabel: 'ผู้พูดหลัก',
                    })
                  }
                  if (Array.isArray(roles.active_participants)) {
                    roles.active_participants.forEach((name: string) => {
                      sessionUsers.push({
                        fullName: name,
                        score: 3,
                        roleLabel: 'มีส่วนร่วม',
                      })
                    })
                  }
                  if (Array.isArray(roles.silent_participants)) {
                    roles.silent_participants.forEach((name: string) => {
                      sessionUsers.push({
                        fullName: name,
                        score: 1,
                        roleLabel: 'ไม่มีส่วนร่วม',
                      })
                    })
                  }
                }

                return (
                  <div key={content.id} className="flex flex-col gap-6">
                    {content.audioUrl && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-bold text-gray-900">
                          🎧 ไฟล์เสียงบันทึกการสอน
                        </h2>
                        <audio
                          controls
                          className="w-full rounded-md outline-none"
                        >
                          <source src={content.audioUrl} type="audio/mpeg" />
                          เบราว์เซอร์ของคุณไม่รองรับการเล่นไฟล์เสียง
                        </audio>
                      </div>
                    )}

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h2 className="mb-4 text-lg font-bold text-gray-900">
                        รายละเอียดการทวน
                      </h2>
                      <p className="whitespace-pre-wrap leading-relaxed text-gray-600">
                        {content.topic}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">
                          สรุปการทวน
                        </h2>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed text-gray-600">
                        {content.summary}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900">
                          ลำดับการพูด
                        </h2>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed text-gray-600">
                        {Array.isArray(content.dataContent?.transcript)
                          ? content.dataContent.transcript
                              .map(
                                (item: any) =>
                                  `[${formatTime(item.start)} - ${formatTime(item.end)}] ${item.speaker}: ${item.text}`,
                              )
                              .join('\n')
                          : content.dataContent?.transcript ||
                            'ไม่มีข้อมูลลำดับการพูด'}
                      </p>
                    </div>

                    {sessionUsers.length > 0 && (
                      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-100 p-6">
                          <h2 className="text-lg font-bold text-gray-900">
                            คนที่เข้าร่วมและคะแนนในรอบนี้
                          </h2>
                        </div>

                        <div className="flex flex-col">
                          {sessionUsers.map((user, index) => (
                            <div
                              key={user.fullName + index}
                              className={`flex items-center justify-between p-4 px-6 ${
                                index !== sessionUsers.length - 1
                                  ? 'border-b border-gray-100'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <img
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    user.fullName,
                                  )}&background=random`}
                                  alt="avatar"
                                  className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {user.fullName}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {user.roleLabel}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm font-bold text-primary">
                                +{user.score} Pt
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="mt-6 flex justify-center pb-10">
                <PaginationDemo
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AppLayout>
  )
}
