import Link from 'next/link'
import { useRouter } from 'next/router'
import { signOut, useSession } from 'next-auth/react'
import { MdLogout } from 'react-icons/md'

import SidebarItem from './Item'
import { USER_ROUTES } from './constants'
import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/services/user'
// import Image from 'next/image'

const SidebarDesktop = () => {
  const router = useRouter()
  const { data: session } = useSession()

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => getMe(session?.user.accessToken ?? '', {}),
    enabled: !!session?.user.accessToken,
  })

  return (
    <div className="drawer-content hidden h-screen w-60 flex-col justify-between bg-white px-3 py-5 shadow-md md:flex">
      <div className="flex flex-col gap-5">
        <Link href="/" className="flex items-center justify-center">
          {/* <Image
            src="/image.png"
            alt="Massager"
            width={100}
            height={100}
            className="h-14 w-14 rounded-full object-cover"
            priority
          /> */}
          <div className="text-md flex-row gap-3 bg-gradient-to-r from-[#252661] via-blue-700 to-sky-600 bg-clip-text px-3 text-xl font-extrabold tracking-wide text-transparent">
            {/* <Waves className="h-50 w-50 text-blue-600" /> */}
            <span className="hidden text-xl sm:inline">FloodSim Viewer</span>
          </div>
        </Link>
        <div className="mt-1 flex flex-col gap-3">
          {session?.user.role === 'USER' &&
            USER_ROUTES.map((r, i) => (
              <SidebarItem
                key={`user-${i}`}
                title={r.title}
                route={r.route}
                currentRoute={router.pathname}
                icon={r.icon}
              />
            ))}
        </div>
      </div>
      {user && (
        <div className="flex flex-col gap-1">
          <div className="pt-3">
            <div className="mb-5 flex flex-col items-center border-b-[0.5px] border-gray-500 p-3">
              <p className="text-base font-semibold text-gray-800">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <button
              onClick={() => {
                signOut({ redirect: false })
                router.push('/')
              }}
              className="mx-auto flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6b92df] px-4 py-2 text-base font-semibold text-white shadow-md transition-all hover:border-2 hover:border-[#6b92df] hover:bg-white hover:text-[#6b92df]"
            >
              <MdLogout className="h-5 w-5" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SidebarDesktop
