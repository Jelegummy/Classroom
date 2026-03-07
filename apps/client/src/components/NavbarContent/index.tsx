import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { IoLogOutOutline } from 'react-icons/io5'

type Props = {
  search: string
  onSearch: (value: string) => void
}

export default function NavbarContent({ search, onSearch }: Props) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="hidden md:block">
        <div className="sticky top-0 flex h-20 items-center border-b bg-white px-8">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <label className="input input-bordered flex h-10 w-[550px] items-center gap-2 rounded-3xl bg-white">
                <FaMagnifyingGlass />
                <input
                  type="text"
                  placeholder="ค้นหาชั้นเรียน..."
                  value={search}
                  onChange={e => onSearch(e.target.value)}
                />
              </label>
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
