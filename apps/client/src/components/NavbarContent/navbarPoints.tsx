import { getRewards } from '@/services/classroom'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { FaCoins } from 'react-icons/fa6'

type Props = {
  classroomId: string
}

export type RewardDataResponse = {
  statusCode: number
  data: number
}

export default function NavbarPoints({ classroomId }: Props) {
  const { data: session } = useSession()
  const { data: reward } = useQuery<RewardDataResponse>({
    queryKey: ['getRewards', classroomId],
    queryFn: async () => {
      const result = await getRewards(classroomId)
      if (!result) throw new Error('Failed to fetch rewards')
      return result
    },
    refetchOnWindowFocus: false,
    refetchInterval: 1000,
  })
  return (
    <>
      <div className="hidden md:block">
        <div className="sticky top-0 flex h-20 items-center border-b bg-white px-8">
          <div className="flex w-full items-center justify-end gap-3">
            <div className="flex flex-row items-center gap-2 rounded-lg bg-[#EA9000] p-2 px-4 py-1 text-white">
              <FaCoins className="text-sm" />
              <h1 className="font-bold">
                {typeof reward === 'number' ? reward : (reward?.data ?? 0)}
              </h1>
            </div>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim() || 'User')}&background=random`}
              alt="avatar"
              className="h-10 w-10 rounded-full border border-gray-200 object-cover"
            />
          </div>
        </div>
      </div>
    </>
  )
}
