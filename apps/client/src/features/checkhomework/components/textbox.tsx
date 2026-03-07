import { useTypewriter } from '../hooks/seTypewriter'
import { SessionState } from '../hooks/useSession'

type Props = {
  text: string
  sessionState: SessionState
}

export default function SessionTextBox({ text, sessionState }: Props) {
  const displayed = useTypewriter(text)

  if (sessionState === 'analyzing') {
    return (
      <div className="-mt-24 w-full max-w-2xl rounded-2xl bg-white p-7 shadow-lg">
        <div className="flex min-h-14 items-center justify-center gap-3">
          <div className="flex gap-1">
            <span className="h-3 w-3 animate-bounce rounded-full bg-blue-500 [animation-delay:0ms]" />
            <span className="h-3 w-3 animate-bounce rounded-full bg-blue-500 [animation-delay:150ms]" />
            <span className="h-3 w-3 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" />
          </div>
          <p className="text-xl text-gray-500">กำลังวิเคราะห์คำตอบ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="-mt-24 w-full max-w-2xl rounded-2xl bg-white p-7 shadow-lg">
      <p className="min-h-14 text-center text-2xl leading-relaxed text-gray-800">
        {displayed}
        <span className="animate-pulse text-3xl font-semibold">_</span>
      </p>
    </div>
  )
}
