import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { MdMenuOpen } from 'react-icons/md'

import SidebarItem from './Item'
import { STUDENT_ROUTES, TEARCHER_ROUTES } from './constants'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const SidebarDesktop = ({ isOpen, onToggle }: SidebarProps) => {
  const router = useRouter()
  const { data: session } = useSession()

  return (
    <aside
      className={`relative hidden h-screen flex-col bg-white py-5 shadow-md transition-all duration-300 md:flex ${
        isOpen ? 'px-3' : 'px-2'
      }`}
    >
      <button
        onClick={onToggle}
        aria-label="Toggle Sidebar"
        className="absolute right-[-16px] top-6 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-100"
      >
        <MdMenuOpen
          className={`h-5 w-5 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div className="flex flex-col gap-4">
        <div
          className={`flex items-center transition-all ${
            isOpen ? 'justify-start gap-2' : 'justify-center'
          }`}
        >
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <Image
              src="/learnify-logo.png"
              alt="Leanify"
              width={44}
              height={44}
              className="rounded-full object-cover"
              priority
            />
            {isOpen && (
              <span className="whitespace-nowrap text-2xl font-extrabold text-black">
                Leanify
              </span>
            )}
          </Link>
        </div>

        <hr />

        <div className="flex flex-col gap-3">
          {(session?.user.role === 'TEACHER' ||
            session?.user.role === 'ADMIN') &&
            TEARCHER_ROUTES.map((r, i) => (
              <SidebarItem
                key={i}
                title={r.title}
                route={r.route}
                currentRoute={router.pathname}
                icon={r.icon}
                isOpen={isOpen}
              />
            ))}
        </div>
        <div className="flex flex-col gap-3">
          {session?.user.role === 'STUDENT' &&
            STUDENT_ROUTES.map((r, i) => (
              <SidebarItem
                key={i}
                title={r.title}
                route={r.route}
                currentRoute={router.pathname}
                icon={r.icon}
                isOpen={isOpen}
              />
            ))}
        </div>
      </div>
    </aside>
  )
}

export default SidebarDesktop
