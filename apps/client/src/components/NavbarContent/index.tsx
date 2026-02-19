import { useSession } from 'next-auth/react'
import { FaMagnifyingGlass } from 'react-icons/fa6'

type Props = {
  search: string
  onSearch: (value: string) => void
}

export default function NavbarContent({ search, onSearch }: Props) {
  const { data: session } = useSession()
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
            <div className="flex flex-row gap-2">
              {/* <h1>sdsdsds</h1> */}
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${session?.user?.firstName || ''} ${session?.user?.lastName || ''}`.trim() || 'User')}&background=random`}
                alt="avatar"
                className="h-10 w-10 rounded-full border border-gray-200 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
