import { getAllTutors } from '@/services/tutor'
import { useQuery } from '@tanstack/react-query'
import { Video } from 'lucide-react'
import StateLink from './components/state-link'
import { useState } from 'react'

interface TutorSessionProps {
  classroomId: string
}

export default function TutorSession({ classroomId }: TutorSessionProps) {
  const [open, setOpen] = useState(false)
  const { data: tutors, isLoading } = useQuery({
    queryKey: ['getAllTutors', classroomId],
    queryFn: () => getAllTutors(),
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
    refetchInterval: 5000,
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tutors?.map(tutor => (
          <div
            key={tutor.id}
            className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="rounded-xl bg-primary p-3 text-white">
                  <Video size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">
                    {tutor.discordChannelId || 'Calculus Problem Set'}
                  </h3>
                  <p className="text-gray-500">
                    {tutor.host.firstName}{' '}
                    {tutor.host.lastName || 'Teeraphan Sukjai'}
                  </p>
                </div>
              </div>
              {/* <span className="rounded-md bg-green-500 px-3 py-1 text-xs text-white">
                ดำเนินการอยู่
              </span> */}
            </div>

            <div className="mt-1">
              <span className="rounded-full px-2 py-1 text-sm font-medium">
                {tutor.startTime &&
                  new Date(tutor.startTime).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
              </span>
            </div>

            <button
              onClick={() => setOpen(true)}
              className="mt-2 w-full rounded-lg bg-primary py-1 font-medium text-white transition-colors hover:bg-primary/80"
            >
              ตรวจสอบ
            </button>

            {open && <StateLink onClose={() => setOpen(false)} />}
          </div>
        ))}
      </div>
    </div>
  )
}
