import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { USER_ROUTES } from '../Sidebar/constants'
import { LogOut, Waves } from 'lucide-react'
import React from 'react'
import { usePathname } from 'next/navigation'

const Navbar = () => {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <>
      <header className="flex h-auto flex-col gap-2 rounded-b-2xl bg-[#1c1d54]">
        <div className="mt-2 flex items-center justify-between p-2 px-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
              <Waves className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">FloodSim Viewer</h1>
            </div>
          </div>
          <div className="flex h-auto flex-row gap-5 px-24 py-3">
            {USER_ROUTES.map((item, index) => (
              <Link
                key={index}
                href={item.route}
                className={`hover:text-shadow-white flex items-center justify-center gap-2 text-lg font-normal text-white hover:shadow-md ${
                  pathname === item.route ? 'border-b border-white' : ''
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center text-white">
                  {item.icon}
                </span>
                <span className="">{item.title}</span>
              </Link>
            ))}
          </div>
          <div className="flex w-40 justify-end">
            {session?.user ? (
              <>
                <button
                  className="group flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white text-lg font-semibold transition-all duration-700 hover:w-40"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-5 w-5 text-gray-800 transition-all duration-1000 group-hover:mr-2" />
                  <span className="w-0 whitespace-nowrap opacity-0 transition-all duration-1000 group-hover:w-auto group-hover:opacity-100">
                    ออกจากระบบ
                  </span>
                </button>
              </>
            ) : (
              <Link href="/login">
                <button className="btn btn-sm rounded-2xl border-[#000000] bg-[#ffffff] placeholder:bg-[#854C2F]">
                  Login
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

export default Navbar
