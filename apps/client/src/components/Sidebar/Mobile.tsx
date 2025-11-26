import Link from 'next/link'
import { useRouter } from 'next/router'
import { signOut, useSession } from 'next-auth/react'

import SidebarItem from './Item'
import { USER_ROUTES } from './constants'

const SidebarMobile = () => {
  const router = useRouter()
  const { data: session } = useSession()

  return (
    <div className="drawer-side z-10">
      <label
        htmlFor="sidebar-drawer"
        aria-label="Close"
        className="drawer-overlay"
      />
      <div className="h-full w-60 bg-white">
        <div className="flex h-full flex-col justify-between px-6 py-8">
          <div className="flex flex-col gap-2">
            <Link href="/" className="flex flex-row items-center gap-3">
              <p className="text-xl font-bold">Floodsim</p>
            </Link>
            <div className="flex flex-col gap-2">
              <div className="mt-6 flex w-full flex-col gap-1">
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
          </div>
          <button
            onClick={() => {
              signOut({ redirect: false })
              router.push('/')
            }}
            className="btn bg-primary/80 hover:bg-primary/90 -mb-4 w-full"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  )
}

export default SidebarMobile
