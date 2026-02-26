'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { CircleUserRound, LogOut, Phone } from 'lucide-react'
import React from 'react'
import Image from 'next/image'

const Navbar = () => {
  const { data: session } = useSession()
  const role = session?.user?.role
  const dashboardUrl =
    role === 'TEACHER'
      ? '/dashboard/teacher/classroom'
      : '/dashboard/student/classroom'

  return (
    <div className="fixed left-1/2 top-6 z-50 flex w-full max-w-4xl -translate-x-1/2 items-center justify-between rounded-full border border-gray-100 bg-white px-4 py-2 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-1">
        <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
          <Image
            src="/learnify-logo.png"
            alt="Learnify Logo"
            width={40}
            height={40}
          />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-black">Learnify</h1>
        </div>
      </div>
      {/* <div className="hidden items-center gap-6 text-sm font-medium text-gray-500 md:flex">
        <Link href="#" className="transition-colors hover:text-black">
          Product
        </Link>
        <Link href="#" className="transition-colors hover:text-black">
          Features
        </Link>
        <Link href="#" className="transition-colors hover:text-black">
          Pricing
        </Link>
        <Link href="#" className="transition-colors hover:text-black">
          Resources
        </Link>
      </div> */}

      <div className="flex items-center gap-2">
        {session?.user ? (
          <>
            <div className="hidden flex-col items-end px-2 sm:flex">
              <span className="text-xs font-semibold text-gray-900">
                {session.user.firstName || 'ผู้ใช้งาน'}
              </span>
            </div>
            <Link
              href={dashboardUrl}
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary/80"
            >
              Dashboard
            </Link>
            <button
              onClick={() => signOut()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-red-500"
              title="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Link href="/login">
              <div className="flex w-36 justify-center">
                <button className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-black">
                  <CircleUserRound className="h-4 w-4" />
                  ลงชื่อเข้าใช้
                </button>
              </div>
            </Link>
            <Link href="/register">
              <button className="btn btn-sm rounded-2xl bg-[#2460E3] text-white placeholder:bg-[#854C2F] hover:bg-primary/80">
                <Phone className="h-4 w-4" />
                ติดต่อเรา
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default Navbar
