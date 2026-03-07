import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { useSession } from '../hooks/useSession'
import CountdownTimer from './countdowntime'
import SessionTextBox from './textbox'
import SessionControls from './control'
import SessionEndOverlay from './endresult'
import { stopSession } from '@/services/assignment'

export default function SessionView() {
  const router = useRouter()
  const { id, sid } = router.query
  const sessionId = sid as string

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const { aiText, sessionState, sessionResult, closeSession } =
    useSession(sessionId)

  // เปิดกล้องมุมขวาบน
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

  const handleEnd = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    closeSession()

    if (sessionState !== 'ended' && sessionId) {
      stopSession(sessionId).catch(() => {})
    }

    if (sessionState === 'ended') {
      router.push(`/dashboard/student/assignment/${id}`)
    } else {
      router.push(`/dashboard/student/assignment/${id}/camera`)
    }
  }

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center bg-zinc-800">
      <div
        className="absolute right-4 top-4 overflow-hidden rounded-2xl shadow-lg"
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

      <CountdownTimer active={sessionState === 'recording'} duration={20} />
      <SessionControls onEnd={handleEnd} />
      {sessionState === 'ended' && (
        <SessionEndOverlay result={sessionResult} onEnd={handleEnd} />
      )}

      <div className="-mt-24 flex flex-col items-center">
        <Image
          src="/botcheck.png"
          alt="AI Avatar"
          width={400}
          height={400}
          className="animate-float relative z-10"
        />
        <SessionTextBox text={aiText} sessionState={sessionState} />
      </div>
    </div>
  )
}
