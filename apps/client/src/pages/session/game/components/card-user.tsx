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
    <div className="flex h-full w-full flex-col bg-white/90 backdrop-blur-md">
      <div className="shrink-0 border-b border-gray-300 bg-blue-50 p-4">
        <h2 className="text-lg font-bold text-gray-800">นักเรียนในห้อง</h2>
        <p className="text-sm font-medium text-blue-600">
          มีนักเรียนอยู่ : {userCount} คน
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <div className="animate-pulse text-center text-sm text-gray-500">
            กำลังโหลดรายชื่อ...
          </div>
        ) : userCount === 0 ? (
          <div className="text-center text-sm text-gray-400">
            ยังไม่มีผู้เล่นในห้องนี้
          </div>
        ) : (
          users?.map(item => {
            return (
              <div
                key={item.user.id}
                className="flex items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() ||
                      'User',
                  )}&background=random`}
                  alt="Profile"
                  className="h-8 w-8 rounded-full border border-gray-300 object-cover"
                />
                <div className="truncate text-sm font-medium text-gray-700">
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
