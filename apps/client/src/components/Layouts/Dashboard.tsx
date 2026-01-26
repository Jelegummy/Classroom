import { useState } from 'react'
import Link from 'next/link'
import { MdMenuOpen } from 'react-icons/md'

import SidebarMobile from '../Sidebar/Mobile'
import SidebarDesktop from '../Sidebar/Desktop'
import Image from 'next/image'

const DashboardLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <div className="fixed top-0 z-40 flex w-full items-center justify-between bg-white px-4 py-2 shadow-md md:hidden">
        <button onClick={() => setMobileOpen(true)}>
          <MdMenuOpen className="h-6 w-6" />
        </button>

        <Link href="/" className="flex items-center overflow-hidden">
          <Image
            src="/learnify-logo.png"
            alt="Leanify"
            width={36}
            height={36}
            className="rounded-full object-cover"
            priority
          />
          <span className="whitespace-nowrap text-xl font-extrabold text-black">
            Leanify
          </span>
        </Link>
      </div>

      <SidebarMobile isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex h-screen pt-12 md:pt-0">
        <div
          className={`hidden transition-all duration-300 md:block ${
            desktopOpen ? 'w-60' : 'w-20'
          }`}
        >
          <SidebarDesktop
            isOpen={desktopOpen}
            onToggle={() => setDesktopOpen(!desktopOpen)}
          />
        </div>

        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      </div>
    </>
  )
}

export default DashboardLayout
