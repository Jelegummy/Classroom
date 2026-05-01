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

export type ChatEntry = {
  type: 'question' | 'answer'
  questionText?: string
  studentAnswer?: string
  expectedAnswer?: string
  isCorrect?: boolean
}

export function useSession(sessionId: string | null) {
  const [aiText, setAiText] = useState('กำลังเชื่อมต่อ...')
  const [sessionState, setSessionState] = useState<SessionState>('connecting')
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null)
  const [chatLog, setChatLog] = useState<ChatEntry[]>([])
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
          // เก็บคำถามลง chatLog
          setChatLog(prev => [
            ...prev,
            { type: 'question', questionText: data.text },
          ])
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
        case 'answer_result': {
          // parse เพราะ Python ส่งมาเป็น JSON string ใน text field
          const payload =
            typeof data.text === 'string' ? JSON.parse(data.text) : data
          setChatLog(prev => {
            // อัปเดต entry ล่าสุดที่เป็น question ให้มีคำตอบ
            const updated = [...prev]
            const lastQ = [...updated]
              .reverse()
              .find(e => e.type === 'question')
            return [
              ...updated,
              {
                type: 'answer',
                studentAnswer: payload.studentAnswer,
                expectedAnswer: payload.expectedAnswer,
                isCorrect: payload.isCorrect,
                questionText: lastQ?.questionText,
              },
            ]
          })
          break
        }
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

  return {
    aiText,
    sessionState,
    setSessionState,
    sessionResult,
    chatLog,
    closeSession,
  }
}
