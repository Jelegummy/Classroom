import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { IoChevronBackSharp } from 'react-icons/io5'

const NavbarSession = () => {
  const { data: session } = useSession()
  const router = useRouter()

  const role = session?.user?.role

  const fallbackHref =
    role === 'TEACHER'
      ? '/dashboard/teacher/classroom'
      : '/dashboard/student/classroom'

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <div className="flex h-auto flex-col gap-2 bg-white">
      <div className="mt-2 flex items-center p-4 px-5">
        <button
          onClick={handleBack}
          className="flex flex-row items-center gap-2"
        >
          <IoChevronBackSharp size={22} />
          <div>ย้อนกลับ</div>
        </button>
      </div>
    </div>
  )
}

export default NavbarSession

//TODO : fix href
