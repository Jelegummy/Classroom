import { FaUserCog, FaCloudRain } from 'react-icons/fa'
import { FaFileArrowDown } from 'react-icons/fa6'
import { LuSchool } from 'react-icons/lu'
// import { TbLockPassword } from 'react-icons/tb'
// import { TbBoxModel2, TbLockPassword } from 'react-icons/tb'

export const USER_ROUTES = [
  {
    title: 'อัปโหลดไฟล์',
    route: '/dashboard/place',
    icon: <FaFileArrowDown />,
  },
  {
    title: 'ปริมาณน้ำฝน',
    route: '/dashboard/spatialrain',
    icon: <FaCloudRain />,
  },
  // {
  //   title: 'โมเดล',
  //   route: '/dashboard/model',
  //   icon: <TbBoxModel2 />,
  // },
  {
    title: 'ข้อมูลสถานที่',
    route: '/dashboard/object',
    icon: <LuSchool />,
  },
  {
    title: 'จัดการบัญชี',
    route: '/dashboard/account',
    icon: <FaUserCog />,
  },
]

// export const USER_MANAGE = [
//   {
//     title: 'ตั้งค่าผู้ใช้งาน',
//     route: '/dashboard/setting',
//     icon: <TbLockPassword />,
//   },
// ]
