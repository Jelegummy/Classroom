import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { useSession } from '../hooks/useSession'
import CountdownTimer from './countdowntime'
import SessionTextBox from './textbox'
import { stopSession } from '@/services/assignment'
import Endresult from './endresult'

export default function SessionView() {
  const DURATION = 10
  const router = useRouter()
  const { id, sid } = router.query
  const sessionId = sid as string

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const { aiText, sessionState, sessionResult, chatLog, closeSession } =
    useSession(sessionId)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {})
    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatLog])

  const handleEnd = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    closeSession()

    if (sessionState !== 'ended' && sessionId) {
      stopSession(sessionId).catch(() => {})
    }

    if (sessionState === 'ended') {
      router.push(`/dashboard/student/assignment/${id}`)
    } else {
      router.push({
        pathname: '/dashboard/student/assignment/homework/camera',
        query: { id: id },
      })
    }
  }

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center bg-gradient-to-r from-blue-950 to-black">
      <div className="grid h-full w-full grid-cols-2 gap-4 p-5">
        <div className="relative flex flex-col items-center rounded-3xl border-[0.5px] border-white/30 bg-gray-800/20 p-10 shadow-2xl backdrop-blur-md">
          <div
            className="absolute left-7 top-7 overflow-hidden rounded-2xl border border-white/20 shadow-lg"
            style={{ width: 240, height: 180 }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
          <div className="absolute right-7 top-7 z-20">
            <CountdownTimer
              active={sessionState === 'recording'}
              duration={DURATION}
            />
          </div>
          <Image
            src="/botcheck.png"
            alt="AI Avatar"
            width={400}
            height={400}
            className="animate-float relative z-10"
          />
          <SessionTextBox text={aiText} sessionState={sessionState} />
          {sessionState === 'ended' && sessionResult && (
            <Endresult result={sessionResult} onEnd={handleEnd} />
          )}
        </div>

        {/* ฝั่งขวา: Chat log */}
        <div className="flex min-h-0 flex-col rounded-3xl border-[0.5px] border-white/30 bg-gray-800/20 p-5 shadow-2xl">
          <div className="mb-3 flex flex-col gap-2 text-white">
            <p className="text-2xl font-semibold">บันทึกคำตอบ</p>
            <hr className="border-[0.5px] border-white/60" />
          </div>

          {/* Chat area */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-scroll pr-1">
            {chatLog.length === 0 && (
              <p className="mt-10 text-center text-sm text-white/40">
                รอคำถามจาก AI...
              </p>
            )}

            {chatLog.map((entry, i) => {
              if (entry.type === 'question') {
                return (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-gray-600/60 px-4 py-3 text-sm leading-relaxed text-white shadow-lg backdrop-blur-sm">
                      <p className="leading-relaxed">{entry.questionText}</p>
                    </div>
                  </div>
                )
              }

              if (entry.type === 'answer') {
                return (
                  <div key={i} className="flex flex-col gap-2">
                    {/* คำตอบนักเรียน */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-blue-600/70 px-4 py-3 text-sm leading-relaxed text-white shadow-lg backdrop-blur-sm">
                        <p className="leading-relaxed">{entry.studentAnswer}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-lg backdrop-blur-sm ${
                          entry.isCorrect
                            ? 'border border-green-400/40 bg-green-900/40 text-green-100'
                            : 'border border-red-400/40 bg-red-900/40 text-red-100'
                        }`}
                      >
                        <p className="text-xs text-white/70">
                          <span className="font-medium text-white/90">
                            เฉลย:{' '}
                          </span>
                          {entry.expectedAnswer}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }

              return null
            })}

            <div ref={chatEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
