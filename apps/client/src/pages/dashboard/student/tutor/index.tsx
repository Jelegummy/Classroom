import { getAllTutors } from '@/services/tutor'
import { useQuery } from '@tanstack/react-query'
import {
  Video,
  CalendarClock,
  ExternalLink,
  ArrowRight,
  MonitorPlay,
} from 'lucide-react'
import StateLink from '@/features/tutor/components/state-link'
import { useState } from 'react'
import DeleteCard from '@/features/tutor/components/delete-card'

interface TutorSessionProps {
  classroomId: string
}

export default function TutorSession({ classroomId }: TutorSessionProps) {
  const [activeTutorId, setActiveTutorId] = useState<string | null>(null)

  const { data: tutors, isLoading } = useQuery({
    queryKey: ['getAllTutors', classroomId],
    queryFn: () => getAllTutors({ classroomId }),
    select: tutors => {
      return (
        tutors?.filter((t: any) =>
          t.classroomSessions?.some(
            (session: any) => session.classroomId === classroomId,
          ),
        ) || []
      )
    },
    refetchOnWindowFocus: false,
    refetchInterval: 1000,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-[280px] animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-gray-200"></div>
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                </div>
              </div>
              <div className="mt-6 h-20 w-full rounded-xl bg-gray-100"></div>
              <div className="mt-4 h-10 w-full rounded-xl bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!tutors || tutors.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-400">
          <MonitorPlay size={48} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          ยังไม่มีห้องติวในขณะนี้
        </h3>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          ยังไม่มีการกำหนดเวลาติวสำหรับห้องเรียนนี้ โปรดตรวจสอบอีกครั้งในภายหลัง
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tutors?.map((tutor: any) => (
          <div
            key={tutor.id}
            className="group relative flex flex-col justify-between gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <Video size={24} />
              </div>
              <div className="flex flex-col">
                <h3 className="line-clamp-1 text-base font-bold text-gray-900">
                  {tutor.discordChannelId || 'Calculus Problem Set'}
                </h3>
                <p className="text-sm font-medium text-gray-500">
                  {tutor.host?.firstName}{' '}
                  {tutor.host?.lastName || 'Teeraphan Sukjai'}
                </p>
              </div>
              <div className="ml-1 flex justify-end sm:ml-6">
                <DeleteCard
                  id={tutor.id}
                  discordChannelId={
                    tutor.discordChannelId || 'Calculus Problem Set'
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-gray-100/50 bg-gray-50 p-4">
              <div className="flex items-center gap-2.5 text-sm text-gray-700">
                <CalendarClock size={16} className="shrink-0 text-gray-400" />
                <span className="font-medium">
                  {tutor.startTime
                    ? new Date(tutor.startTime).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'ยังไม่ระบุเวลา'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-sm">
                <ExternalLink size={16} className="shrink-0 text-gray-400" />
                {tutor.inviteLink ? (
                  <a
                    href={tutor.inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
                  >
                    เข้าร่วมห้องติว Discord
                  </a>
                ) : (
                  <span className="text-gray-500">ไม่มีลิงก์เข้าร่วม</span>
                )}
              </div>
            </div>

            <button
              onClick={() => setActiveTutorId(tutor.id)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              ตรวจสอบรายละเอียด
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>

      {activeTutorId && <StateLink onClose={() => setActiveTutorId(null)} />}
    </div>
  )
}
