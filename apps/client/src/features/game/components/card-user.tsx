import { getUsersByClassroomId } from '@/services/classroom'
import { UserInClassroom } from '@/services/classroom/types'
import { useQuery } from '@tanstack/react-query'

interface CardUserProps {
  classroomId?: string
}

export default function CardUser({ classroomId }: CardUserProps) {
  const { data: users, isLoading } = useQuery<UserInClassroom[]>({
    queryKey: ['classroom-users', classroomId],
    queryFn: async () => {
      const result = await getUsersByClassroomId(classroomId ?? '')
      return result ?? []
    },
    enabled: !!classroomId,
    refetchInterval: 1000,
  })

  const userCount = users?.length || 0

  return (
    <div className="flex h-full w-full flex-col bg-white/90 backdrop-blur-lg">
      <div className="shrink-0 border-b border-gray-300 bg-blue-50 p-1.5 lg:p-4">
        <h2 className="text-sm font-bold text-gray-800 lg:text-lg">
          นักเรียนในห้อง
        </h2>
        <p className="text-sm font-medium text-blue-600 lg:text-sm">
          มีนักเรียนอยู่ : {userCount} คน
        </p>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-1.5 lg:space-y-3 lg:p-4">
        {isLoading ? (
          <div className="animate-pulse text-center text-sm text-gray-500 lg:text-sm">
            กำลังโหลดรายชื่อ...
          </div>
        ) : userCount === 0 ? (
          <div className="text-center text-sm text-gray-400 lg:text-sm">
            ยังไม่มีผู้เล่นในห้องนี้
          </div>
        ) : (
          users?.map(item => {
            return (
              <div
                key={item.user.id}
                className="flex items-center space-x-1.5 rounded-lg p-1 transition-colors hover:bg-gray-100 lg:space-x-3 lg:rounded-lg lg:p-2"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() ||
                      'User',
                  )}&background=random`}
                  alt="Profile"
                  className="h-7 w-7 rounded-full border border-gray-300 object-cover lg:h-8 lg:w-8"
                />
                <div className="truncate text-sm font-medium text-gray-700 lg:text-sm">
                  {item.user.firstName} {item.user.lastName}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
