import React from 'react'
import { PiNewspaperLight } from 'react-icons/pi'
import { LuUsersRound } from 'react-icons/lu'

interface ChangemodeProps {
  activeTab: 'details' | 'submissions'
  setActiveTab: (tab: 'details' | 'submissions') => void
}

function Changemode({ activeTab, setActiveTab }: ChangemodeProps) {
  return (
    <div>
      <div className="flex w-max max-w-xl gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex h-9 items-center gap-1 rounded-md px-3 transition-colors ${
            activeTab === 'details'
              ? 'bg-blue-500 text-white'
              : 'text-gray-800 hover:bg-gray-100'
          }`}
        >
          <PiNewspaperLight className="size-6" />
          รายละเอียด
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex h-9 items-center gap-1 rounded-md px-3 transition-colors ${
            activeTab === 'submissions'
              ? 'bg-blue-500 text-white'
              : 'text-gray-800 hover:bg-gray-100'
          }`}
        >
          <LuUsersRound className="size-5" />
          การส่งงานทั้งหมด
        </button>
      </div>
    </div>
  )
}

export default Changemode
