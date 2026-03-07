import { getRewards } from '@/services/classroom'
import { useQuery } from '@tanstack/react-query'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { FaCoins } from 'react-icons/fa6'
import { IoLogOutOutline } from 'react-icons/io5'

type Props = {
  classroomId: string
}

export type RewardDataResponse = {
  statusCode: number
  data: number
}

export default function NavbarPoints({ classroomId }: Props) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
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
            <div className="relative">
              <div
                className="flex cursor-pointer items-center gap-2"
                onClick={() => setOpen(!open)}
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim() ||
                      'User',
                  )}&background=random`}
                  alt="avatar"
                  className="h-10 w-10 rounded-full border border-gray-200 object-cover transition hover:opacity-80"
                />
              </div>
              {open && (
                <div className="absolute right-0 top-12 flex w-40 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                  <button
                    onClick={() => signOut()}
                    className="flex w-full flex-row items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-500 transition hover:bg-red-50"
                  >
                    <IoLogOutOutline className="h-5 w-5" />
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
