import Link from 'next/link'
import { IoChevronBackSharp } from 'react-icons/io5'

const NavbarGame = () => {
  return (
    <>
      <div className="flex h-auto flex-col gap-2 bg-white">
        <div className="mt-2 flex items-center p-4 px-5">
          <Link href="/dashboard/teacher/classroom/">
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

export default NavbarGame
