import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { IoChevronBackSharp } from 'react-icons/io5'

const NavbarSession = () => {
  const { data: session } = useSession()
  const role = session?.user?.role
  const href =
    role === 'TEACHER'
      ? '/dashboard/teacher/classroom'
      : '/dashboard/student/classroom'

  return (
    <>
      <div className="flex h-auto flex-col gap-2 bg-white">
        <div className="mt-2 flex items-center p-4 px-5">
          <Link href={href}>
            <div className="flex flex-row items-center gap-2">
              <IoChevronBackSharp size={22} />
              <div>ย้อนกลับ</div>
            </div>
          </Link>
        </div>
      </div>
    </>
  )
}

export default NavbarSession

//TODO : fix href
