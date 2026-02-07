import { useState } from 'react'
import { MdContentCopy, MdCheck } from 'react-icons/md'

export default function CopyCode({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="relative flex items-center gap-2">
      <div
        onClick={handleCopy}
        className="flex cursor-pointer items-center rounded-xl border border-[#bababa] px-2 py-1 text-sm hover:bg-base-300"
      >
        <code className="text-sm">{text}</code>

        <button
          onClick={handleCopy}
          className="btn btn-ghost btn-xs"
          aria-label="Copy code"
        >
          {isCopied ? <MdCheck className="text-success" /> : <MdContentCopy />}
        </button>
      </div>
    </div>
  )
}
