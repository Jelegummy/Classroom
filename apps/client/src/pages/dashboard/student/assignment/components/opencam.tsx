import { useEffect, useRef, useState } from 'react'
import { IoIosMic } from 'react-icons/io'
import { IoMicOff, IoVideocam, IoVideocamOff, IoHeadset } from 'react-icons/io5'
import { useRouter } from 'next/router'
import { startSession } from '@/services/assignment'

export default function OpenCam() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const router = useRouter()
  const assignmentId = router.query.id as string
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedMic, setSelectedMic] = useState('')
  const [selectedCam, setSelectedCam] = useState('')
  const [selectedSpeaker, setSelectedSpeaker] = useState('')
  const [camOn, setCamOn] = useState(false)
  const [micOn, setMicOn] = useState(false)

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(list => {
      setDevices(list)
      const defaultMic = list.find(d => d.kind === 'audioinput')
      const defaultCam = list.find(d => d.kind === 'videoinput')
      const defaultSpeaker = list.find(d => d.kind === 'audiooutput')
      if (defaultMic) setSelectedMic(defaultMic.deviceId)
      if (defaultCam) setSelectedCam(defaultCam.deviceId)
      if (defaultSpeaker) setSelectedSpeaker(defaultSpeaker.deviceId)
    })
  }, [])

  const handleStart = async () => {
    if (!camOn) {
      alert('กรุณาเปิดกล้องก่อนเริ่ม')
      return
    }
    if (!assignmentId) {
      alert('ไม่พบ assignment ID')
      return
    }
    setLoading(true)
    try {
      const res = await startSession(assignmentId)
      setSessionId(res.session_id)
      router.push(
        `/dashboard/student/assignment/${assignmentId}/session?sid=${res.session_id}`,
      )
    } catch (e: any) {
      console.error('Error:', e)
      alert(`เริ่ม session ไม่สำเร็จ: ${e?.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedMic) return
    startStream()
  }, [selectedMic])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const startStream = async () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: { deviceId: selectedMic ? { exact: selectedMic } : undefined },
    })
    stream.getAudioTracks().forEach(t => (t.enabled = false))
    streamRef.current = stream
    if (videoRef.current) videoRef.current.srcObject = stream
  }

  const toggleCamera = async () => {
    if (camOn) {
      streamRef.current?.getVideoTracks().forEach(t => {
        t.stop()
        streamRef.current?.removeTrack(t)
      })
      setCamOn(false)
    } else {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCam ? { exact: selectedCam } : undefined },
      })
      const videoTrack = newStream.getVideoTracks()[0]
      streamRef.current?.getVideoTracks().forEach(t => {
        t.stop()
        streamRef.current?.removeTrack(t)
      })
      streamRef.current?.addTrack(videoTrack)
      if (videoRef.current) videoRef.current.srcObject = streamRef.current
      setCamOn(true)
    }
  }

  const toggleMic = async () => {
    if (micOn) {
      streamRef.current?.getAudioTracks().forEach(t => {
        t.stop()
        streamRef.current?.removeTrack(t)
      })
      setMicOn(false)
    } else {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedMic ? { exact: selectedMic } : undefined },
      })
      const audioTrack = newStream.getAudioTracks()[0]
      streamRef.current?.getAudioTracks().forEach(t => {
        t.stop()
        streamRef.current?.removeTrack(t)
      })
      streamRef.current?.addTrack(audioTrack)
      setMicOn(true)
    }
  }

  const handleChangeCam = async (deviceId: string) => {
    setSelectedCam(deviceId)
    if (!camOn) return
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
    })
    const videoTrack = newStream.getVideoTracks()[0]
    streamRef.current?.getVideoTracks().forEach(t => {
      t.stop()
      streamRef.current?.removeTrack(t)
    })
    streamRef.current?.addTrack(videoTrack)
    if (videoRef.current) videoRef.current.srcObject = streamRef.current
  }

  const handleChangeMic = async (deviceId: string) => {
    setSelectedMic(deviceId)
    if (!micOn) return
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
    })
    const audioTrack = newStream.getAudioTracks()[0]
    streamRef.current?.getAudioTracks().forEach(t => {
      t.stop()
      streamRef.current?.removeTrack(t)
    })
    streamRef.current?.addTrack(audioTrack)
  }

  const handleChangeSpeaker = async (deviceId: string) => {
    setSelectedSpeaker(deviceId)
    if (audioRef.current && 'setSinkId' in audioRef.current) {
      await (audioRef.current as any).setSinkId(deviceId)
    }
  }

  const testSpeaker = async () => {
    if (!audioRef.current) return
    if ('setSinkId' in audioRef.current) {
      await (audioRef.current as any).setSinkId(selectedSpeaker)
    }
    audioRef.current.src = '/test-sound.mp3'
    audioRef.current.play()
  }

  const microphones = devices.filter(d => d.kind === 'audioinput')
  const cameras = devices.filter(d => d.kind === 'videoinput')
  const speakers = devices.filter(d => d.kind === 'audiooutput')

  return (
    <div className="flex w-full flex-col gap-4">
      <h2 className="mb-2 text-xl font-bold text-gray-800">
        ตั้งค่ากล้องและไมโครโฟน
      </h2>

      <audio ref={audioRef} className="hidden" />

      <div className="relative aspect-video w-full">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="aspect-video w-full rounded-xl bg-gray-900"
          style={{ transform: 'scaleX(-1)' }}
        />
        {!camOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-gray-800">
            <IoVideocamOff className="size-16 text-gray-200" />
            <p className="text-gray-200">กล้องของคุณปิดอยู่</p>
          </div>
        )}
      </div>

      <div className="flex w-full justify-between">
        <div className="flex gap-2">
          {/* กล้อง */}
          <div className="flex w-52 items-center gap-2 rounded-xl border border-gray-200 p-3 shadow-sm">
            <button onClick={toggleCamera}>
              {camOn ? (
                <IoVideocam className="size-6 text-blue-500" />
              ) : (
                <IoVideocamOff className="size-6" />
              )}
            </button>
            <b className="h-full border-[0.5px] border-gray-300" />
            <select
              value={selectedCam}
              onChange={e => handleChangeCam(e.target.value)}
              className="w-36 truncate bg-transparent outline-none"
            >
              {cameras.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || 'Camera'}
                </option>
              ))}
            </select>
          </div>

          {/* ไมค์ */}
          <div className="flex w-52 items-center gap-2 rounded-xl border border-gray-200 p-3 shadow-sm">
            <button onClick={toggleMic}>
              {micOn ? (
                <IoIosMic className="size-6 text-blue-500" />
              ) : (
                <IoMicOff className="size-6" />
              )}
            </button>
            <b className="h-full border-[0.5px] border-gray-300" />
            <select
              value={selectedMic}
              onChange={e => handleChangeMic(e.target.value)}
              className="w-36 truncate bg-transparent outline-none"
            >
              {microphones.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || 'Microphone'}
                </option>
              ))}
            </select>
          </div>

          {/* ลำโพง */}
          <div className="flex w-52 items-center gap-2 rounded-xl border border-gray-200 p-3 shadow-sm">
            <button onClick={testSpeaker}>
              <IoHeadset className="size-6 text-gray-600 hover:text-blue-500" />
            </button>
            <b className="h-full border-[0.5px] border-gray-300" />
            <select
              value={selectedSpeaker}
              onChange={e => handleChangeSpeaker(e.target.value)}
              className="w-36 truncate bg-transparent outline-none"
            >
              {speakers.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || 'Speaker'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={loading || !camOn}
          className="flex items-center gap-2 rounded-xl bg-blue-500 p-3 px-4 text-white shadow-sm hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'กำลังเริ่ม...' : 'เริ่มการตอบคำถาม'}
        </button>
      </div>
    </div>
  )
}
