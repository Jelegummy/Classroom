import { useState } from 'react'
import { MdContentCopy, MdCheck, MdClose } from 'react-icons/md'

export default function CopyCode({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleCopy = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!text) return

    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-2 transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:bg-primary/10 hover:shadow-md"
        title="คลิกเพื่อขยายรหัสชั้นเรียน"
      >
        <div className="flex flex-row items-center gap-2 text-right">
          <code className="text-sm font-bold tracking-widest text-primary">
            {text}
          </code>
          <div className="flex h-8 w-8 items-center justify-center rounded-full transition-colors">
            <MdContentCopy className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl transform rounded-3xl bg-white p-8 shadow-2xl transition-all sm:p-12"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
            >
              <MdClose className="h-6 w-6" />
            </button>

            <div className="flex flex-col items-center text-center">
              <h3 className="mb-6 text-xl font-bold text-gray-500">
                เข้าร่วมชั้นเรียนด้วยรหัสนี้
              </h3>

              <div className="mb-8 flex w-full justify-center rounded-2xl border-4 border-dashed border-gray-200 bg-gray-50 py-10">
                <code className="font-mono text-6xl font-black tracking-[0.2em] text-primary sm:text-7xl md:text-8xl">
                  {text}
                </code>
              </div>

              <button
                onClick={handleCopy}
                className={`flex w-full max-w-sm items-center justify-center gap-3 rounded-2xl py-4 text-xl font-bold text-white transition-all duration-300 active:scale-95 ${
                  isCopied
                    ? 'bg-green-500 shadow-lg shadow-green-500/30'
                    : 'bg-primary shadow-lg shadow-primary/30 hover:bg-blue-600'
                }`}
              >
                {isCopied ? (
                  <>
                    <MdCheck className="h-8 w-8" />
                    คัดลอกรหัสสำเร็จแล้ว!
                  </>
                ) : (
                  <>
                    <MdContentCopy className="h-8 w-8" />
                    คัดลอกรหัส
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
