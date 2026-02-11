import Link from 'next/link'
import { IoChevronBackSharp } from 'react-icons/io5'
import { RiSwordFill } from 'react-icons/ri'

const NavbarLeader = () => {
  return (
    <>
      <div className="flex h-auto flex-col gap-2 border bg-white shadow-md">
        <div className="mt-2 flex items-center justify-between p-4 px-5">
          <Link href="/dashboard/teacher/classroom/">
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
