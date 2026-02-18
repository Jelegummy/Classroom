import { getTutorContentById, getTutorContentUserById } from '@/services/tutor'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import { FaArrowLeft } from 'react-icons/fa'

export default function Content() {
  const router = useRouter()
  if (!router.isReady) return null

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

  if (isContentLoading || isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        กำลังโหลดข้อมูล...
      </div>
    )
  }

  return (
    <AppLayout>
      <DashboardLayout>
        <div className="mt-10 min-h-screen bg-[#F8FAFC] p-4 md:p-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 sm:px-32"
          >
            <FaArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </button>
          <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-6">
            {contents?.map(content => (
              <div key={content.id} className="flex flex-col gap-6">
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
                  {content.dataContent?.roles && (
                    <div className="mt-4 rounded-lg border border-gray-300 bg-gray-50 p-4">
                      <h3 className="text-md font-semibold text-gray-800">
                        ผู้พูดหลัก: {content.dataContent.roles.main_speaker}
                      </h3>
                      <p className="mt-2 text-gray-600">
                        ผู้เข้าร่วม:{' '}
                        {content.dataContent.roles.active_participants?.join(
                          ', ',
                        ) || '-'}
                      </p>
                      <p className="mt-2 text-gray-600">
                        ไม่มีส่วนร่วม:{' '}
                        {content.dataContent.roles.silent_participants?.join(
                          ', ',
                        ) || '-'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {contentUser && contentUser.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-gray-900">
                    คนที่เข้าร่วมการทวน
                  </h2>
                </div>

                <div className="flex flex-col">
                  {contentUser.map((user: any, index: number) => (
                    <div
                      key={user.userId || index}
                      className={`flex items-center justify-between p-4 px-6 ${
                        index !== contentUser.length - 1
                          ? 'border-b border-gray-100'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`}
                          alt="avatar"
                          className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">
                            {user.fullName}
                          </span>
                          {index === 0 && (
                            <span className="text-xs text-gray-400">
                              ผู้สอน
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-blue-600">
                        {user.scoreEarnedInSession || 2} Pt
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AppLayout>
  )
}
