import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { IoChevronBackSharp } from 'react-icons/io5'
import { RiSwordFill } from 'react-icons/ri'

const NavbarLeader = () => {
  const { data: session } = useSession()
  const role = session?.user?.role
  const href =
    role === 'TEACHER'
      ? '/dashboard/teacher/classroom'
      : '/dashboard/student/classroom'

  return (
    <>
      <div className="flex h-auto flex-col gap-2 border bg-white shadow-md">
        <div className="mt-2 flex items-center justify-between p-4 px-5">
          <Link href={href}>
            <div className="flex flex-row items-center gap-2">
              <IoChevronBackSharp size={22} />
              <div>ย้อนกลับ</div>
            </div>
          </Link>
          <div className="flex flex-row items-center gap-2">
            <RiSwordFill size={22} className="text-primary" />
            <div>สรุปผลการต่อสู้</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default NavbarLeader
