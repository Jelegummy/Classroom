import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { LogOut, Phone, CircleUserRound } from 'lucide-react'
import React from 'react'
import Image from 'next/image'

const Navbar = () => {
  const { data: session } = useSession()

  return (
    <>
      <div className="flex h-auto flex-col gap-2">
        <div className="mt-2 flex items-center justify-between p-2 px-5">
          <div className="flex items-center">
            <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
              <Image
                src="/learnify-logo.png"
                alt="Learnify Logo"
                width={50}
                height={50}
              />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-black">Learnify</h1>
            </div>
          </div>
          <div className="flex flex-row items-center justify-center">
            <div className="flex justify-end">
              {session?.user ? (
                <>
                  <button
                    className="flex h-10 w-10 flex-row bg-white text-lg"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-5 w-5 text-gray-800" />
                  </button>
                </>
              ) : (
                <div className="flex flex-row items-center">
                  <Link href="/login">
                    <div className="flex w-36 justify-center">
                      <button className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-black">
                        <CircleUserRound className="h-4 w-4" />
                        ลงชื่อเข้าใช้
                      </button>
                    </div>
                  </Link>
                  <Link href="/register">
                    <button className="btn btn-sm rounded-2xl bg-[#2460E3] text-white placeholder:bg-[#854C2F]">
                      <Phone className="h-4 w-4" />
                      ติดต่อเรา
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar
