import { useState } from 'react'
import { MdArrowBackIos } from 'react-icons/md'
type Mode = 'all' | 'pending' | 'overdue' | 'submitted'

interface FilterMode {
  mode: Mode
  setMode: (mode: Mode) => void
}

const options = [
  { value: 'all', label: 'งานทั้งหมด' },
  { value: 'pending', label: 'ยังไม่ครบกำหนด' },
  { value: 'overdue', label: 'ครบกำหนดแล้ว' },
  { value: 'submitted', label: 'ส่งแล้ว' },
]

export default function AssignmentFilterDropdown({
  mode,
  setMode,
}: FilterMode) {
  const current = options.find(o => o.value === mode)

  return (
    <div className="dropdown dropdown-end h-full">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-sm flex h-full justify-between gap-10 bg-white p-2 hover:bg-gray-100"
      >
        {current?.label}
        <MdArrowBackIos className="size-3 -rotate-90" />
      </div>
      <ul
        tabIndex={0}
        className="menu dropdown-content w-40 rounded-box bg-base-100 p-2 shadow-md"
      >
        {options.map(option => (
          <li key={option.value}>
            <a
              onClick={() => {
                setMode(option.value as Mode)
                ;(document.activeElement as HTMLElement)?.blur()
              }}
            >
              {option.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
