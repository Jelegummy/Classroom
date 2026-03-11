// import { GoBook, GoHome } from 'react-icons/go'
import { SiGoogleclassroom } from 'react-icons/si'
// import { IoMdPaper } from 'react-icons/io'
import { TbBrandGoogleHome, TbLockPassword } from 'react-icons/tb'
import { GiFragmentedSword } from 'react-icons/gi'
import { SiNodemon } from 'react-icons/si'
import { MdOutlineGeneratingTokens } from 'react-icons/md'

export const TEARCHER_ROUTES = [
  // {
  //   title: 'หน้าแรก',
  //   route: '/dashboard/teacher',
  //   icon: <GoHome className="h-6 w-6" />,
  // },
  {
    title: 'ห้องเรียน',
    route: '/dashboard/teacher/classroom',
    icon: <SiGoogleclassroom className="h-6 w-6" />,
  },
  {
    title: 'ตั้งค่า',
    route: '/dashboard/setting',
    icon: <TbLockPassword className="h-6 w-6" />,
  },
  {
    title: 'ซื้อ Tokens',
    route: '/dashboard/teacher/token',
    icon: <MdOutlineGeneratingTokens className="h-6 w-6" />,
  },
  // {
  //   title: 'การบ้าน',
  //   route: '/dashboard/teacher/homework',
  //   icon: <IoMdPaper className="h-6 w-6" />,
  // },
  // {
  //   title: 'การติว',
  //   route: '/dashboard/teacher/tutoring',
  //   icon: <GoBook className="h-6 w-6" />,
  // },
]

export const STUDENT_ROUTES = [
  // {
  //   title: 'หน้าแรก',
  //   route: '/dashboard/student',
  //   icon: <GoHome className="h-6 w-6" />,
  // },
  {
    title: 'ห้องเรียน',
    route: '/dashboard/student/classroom',
    icon: <SiGoogleclassroom className="h-6 w-6" />,
  },
  {
    title: 'ตั้งค่า',
    route: '/dashboard/setting',
    icon: <TbLockPassword className="h-6 w-6" />,
  },
  // {
  //   title: 'การบ้าน',
  //   route: '/dashboard/student/homework',
  //   icon: <IoMdPaper className="h-6 w-6" />,
  // },
  // {
  //   title: 'การติว',
  //   route: '/dashboard/student/tutoring',
  //   icon: <GoBook className="h-6 w-6" />,
  // },
  // {
  //   title: 'คลังไอเทม',
  //   route: '/dashboard/student/inventory',
  //   icon: <GoBook className="h-6 w-6" />,
  // },
]

export const ADMIN_ROUTES = [
  {
    title: 'หน้าแรก',
    route: '/dashboard/admin',
    icon: <TbBrandGoogleHome className="h-6 w-6" />,
  },
  {
    title: 'ไอเทมในเกม',
    route: '/dashboard/admin/items',
    icon: <GiFragmentedSword className="h-6 w-6" />,
  },
  {
    title: 'ตัวละครสำหรับเกม',
    route: '/dashboard/admin/characters',
    icon: <SiNodemon className="h-6 w-6" />,
  },
  {
    title: 'ตั้งค่า',
    route: '/dashboard/setting',
    icon: <TbLockPassword className="h-6 w-6" />,
  },
]

// export const USER_MANAGE = [
//   {
//     title: 'ตั้งค่าผู้ใช้งาน',
//     route: '/dashboard/setting',
//     icon: <TbLockPassword />,
//   },
// ]
