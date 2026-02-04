import Link from 'next/link'
import { useRouter } from 'next/router'
import { signOut, useSession } from 'next-auth/react'
import SidebarItem from './Item'
import { TEARCHER_ROUTES } from './constants'

interface SidebarMobileProps {
  isOpen: boolean
  onClose: () => void
}

const SidebarMobile = ({ isOpen, onClose }: SidebarMobileProps) => {
  const router = useRouter()
  const { data: session } = useSession()

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 md:hidden ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-40' : 'opacity-0'
        }`}
      />
      <aside
        className={`absolute left-0 top-0 h-full w-72 bg-white shadow-xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between px-6 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 rounded-xl border p-3">
              <div className="h-10 w-10 rounded-full bg-gray-300" />
              <div className="flex flex-col">
                <span className="font-semibold">{session?.user.name}</span>
                <span className="text-xs text-gray-500">
                  {session?.user.email}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {(session?.user.role === 'ADMIN' ||
                session?.user.role === 'TEACHER') &&
                TEARCHER_ROUTES.map((r, i) => (
                  <SidebarItem
                    key={i}
                    title={r.title}
                    route={r.route}
                    currentRoute={router.pathname}
                    icon={r.icon}
                    isOpen
                    onClick={onClose}
                  />
                ))}
            </div>
          </div>

          <button
            onClick={() => {
              signOut({ redirect: false })
              router.push('/')
            }}
            className="btn w-full bg-[#1F57CF] text-white hover:bg-[#194bb5]"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </div>
  )
}

export default SidebarMobile
