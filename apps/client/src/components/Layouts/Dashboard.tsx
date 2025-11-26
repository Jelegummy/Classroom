import Link from 'next/link'
import { FaAlignJustify } from 'react-icons/fa6'

import Sidebar from '../Sidebar'

const DashboardLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <>
      <div className="flex w-full items-center justify-between bg-white p-2 px-4 py-2 shadow-md md:hidden">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Link href="/" className="flex flex-row items-center gap-2">
            <p className="mt-1 border-l border-gray-300 pl-2 text-sm font-bold md:text-sm">
              Floodsim
            </p>
          </Link>
        </h2>
        <label
          htmlFor="sidebar-drawer"
          aria-label="Open"
          className="btn btn-ghost drawer-button flex items-center justify-center"
        >
          <FaAlignJustify className="h-5 w-5" />
        </label>
      </div>

      <div className="flex h-screen flex-row">
        <div className="w-auto text-white">
          <Sidebar />
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </>
  )
}

export default DashboardLayout
