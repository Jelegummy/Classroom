import { IoIosMic } from 'react-icons/io'
import { IoMicOff, IoHeadset } from 'react-icons/io5'
import { MdCallEnd } from 'react-icons/md'
import { useState } from 'react'

type Props = {
  onEnd: () => void
}

export default function Controls({ onEnd }: Props) {
  const [micOn, setMicOn] = useState(true)

  return (
    <div className="absolute bottom-8 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/50 p-3">
      <button
        onClick={() => setMicOn(p => !p)}
        className="flex items-center gap-2 rounded-xl border border-gray-600 bg-white px-4 py-3 hover:bg-gray-200"
      >
        {micOn ? (
          <IoIosMic className="size-5" />
        ) : (
          <IoMicOff className="size-5 text-red-400" />
        )}
        <span className="text-sm">ไมโครโฟน</span>
      </button>

      <button className="flex items-center gap-2 rounded-xl border border-gray-600 bg-white px-4 py-3 hover:bg-gray-200">
        <IoHeadset className="size-5" />
        <span className="text-sm">ลำโพง</span>
      </button>

      <button
        onClick={onEnd}
        className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-white hover:bg-red-600"
      >
        <MdCallEnd className="size-5" />
        <span className="text-sm">สิ้นสุดการตอบคำถาม</span>
      </button>
    </div>
  )
}
