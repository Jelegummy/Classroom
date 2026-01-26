import { GoBook, GoHome } from 'react-icons/go'
import { SiGoogleclassroom } from 'react-icons/si'
import { IoMdPaper } from 'react-icons/io'

export const USER_ROUTES = [
  {
    title: 'หน้าแรก',
    route: '/dashboard/place',
    icon: <GoHome className="h-6 w-6" />,
  },
  {
    title: 'ห้องเรียน',
    route: '/dashboard/classroom',
    icon: <SiGoogleclassroom className="h-6 w-6" />,
  },
  {
    title: 'การบ้าน',
    route: '/dashboard/homework',
    icon: <IoMdPaper className="h-6 w-6" />,
  },
  {
    title: 'การติว',
    route: '/dashboard/tutoring',
    icon: <GoBook className="h-6 w-6" />,
  },
]

// export const USER_MANAGE = [
//   {
//     title: 'ตั้งค่าผู้ใช้งาน',
//     route: '/dashboard/setting',
//     icon: <TbLockPassword />,
//   },
// ]
