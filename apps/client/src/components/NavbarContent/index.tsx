import { getAllClassrooms } from '@/services/classroom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { useDebounce } from 'use-debounce'

type Props = {
  search: string
  onSearch: (value: string) => void
}

export default function NavbarContent({ search, onSearch }: Props) {
  return (
    <>
      <div className="hidden md:block">
        <div className="sticky top-0 flex h-20 items-center border-b bg-white px-8">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <label className="input input-bordered flex h-10 w-[550px] items-center gap-2 rounded-3xl bg-white">
                <FaMagnifyingGlass />
                <input
                  type="text"
                  placeholder="ค้นหาชั้นเรียน..."
                  value={search}
                  onChange={e => onSearch(e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-row gap-2">
              <h1>sds</h1>
              <h1>sdfghjkjhgfdswdfghjkljhg</h1>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
