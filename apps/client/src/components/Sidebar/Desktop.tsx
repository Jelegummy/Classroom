import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import Image from 'next/image'
import { MdMenuOpen } from 'react-icons/md'

import SidebarItem from './Item'
import { USER_ROUTES } from './constants'

const SidebarDesktop = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div
      className={`drawer-content hidden h-screen flex-col bg-white py-5 shadow-md transition-all duration-300 md:flex ${isOpen ? 'w-60 px-3' : 'w-20 px-2'} `}
    >
      <div className="flex flex-col gap-6">
        <div
          className={`flex items-center transition-all ${
            isOpen ? 'justify-start gap-2' : 'justify-center'
          }`}
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100"
            aria-label="Toggle Sidebar"
          >
            <MdMenuOpen
              className={`h-6 w-6 text-black transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <Link href="/" className="flex items-center overflow-hidden">
              <Image
                src="/learnify-logo.png"
                alt="Leanify"
                width={44}
                height={44}
                className="rounded-full object-cover"
                priority
              />
              <span className="whitespace-nowrap text-2xl font-extrabold tracking-wide text-black">
                Leanify
              </span>
            </Link>
          )}
        </div>

        <div className="mt-1 flex flex-col gap-3">
          {session?.user.role === 'ADMIN' &&
            USER_ROUTES.map((r, i) => (
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
    </div>
  )
}

export default SidebarDesktop
