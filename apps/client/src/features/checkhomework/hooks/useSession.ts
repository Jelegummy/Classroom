import { useEffect, useRef, useState } from 'react'

export type SessionState =
  | 'connecting'
  | 'waiting'
  | 'question'
  | 'recording'
  | 'analyzing'
  | 'ended'

export type SessionResult = {
  correct: number
  total: number
  passed: boolean
}

export function useSession(sessionId: string | null) {
  const [aiText, setAiText] = useState('กำลังเชื่อมต่อ...')
  const [sessionState, setSessionState] = useState<SessionState>('connecting')
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const wsUrl = (
      process.env.NEXT_PUBLIC_API_8000 ?? 'http://127.0.0.1:8000'
    ).replace('http', 'ws')

    const ws = new WebSocket(`${wsUrl}/ws/session/${sessionId}`)
    wsRef.current = ws

    ws.onopen = () => {
      setAiText('เชื่อมต่อแล้ว รอสักครู่...')
      setSessionState('waiting')
    }

    ws.onmessage = e => {
      const data = JSON.parse(e.data)

      switch (data.type) {
        case 'ai_text':
          setAiText(data.text)
          setSessionState('question')
          break
        case 'warning':
        case 'info':
          setAiText(data.text)
          break
        case 'start_recording':
          setSessionState('recording')
          break
        case 'transcript':
          setSessionState('analyzing')
          break
        case 'session_end':
          setSessionState('ended')
          break
        case 'session_result':
          setSessionResult(data)
          break
      }
    }

    ws.onerror = () => setAiText('เกิดข้อผิดพลาดในการเชื่อมต่อ')

    return () => ws.close()
  }, [sessionId])

  const closeSession = () => wsRef.current?.close()

  return { aiText, sessionState, setSessionState, sessionResult, closeSession }
}