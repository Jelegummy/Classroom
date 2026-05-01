import {
  generateQuestions,
  regenerateQuestions,
  confirmAssignment,
} from '@/services/assignment'
import { useMutation } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { MdOutlineAssignment, MdQuiz, MdRefresh } from 'react-icons/md'

interface ChatMessage {
  role: string
  content: string
}

interface AssignmentData {
  questions: ChatMessage[]
  extractedText: string
  generatedTxt: string
  answerFile: { answer: string; question: string }[] | null
  filePdf: string | undefined
}

export default function CreateButtonAssignment({
  classroomId,
}: {
  classroomId: string
}) {
  const { data: session, status } = useSession()
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(
    null,
  )
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const pdfBytesRef = useRef<ArrayBuffer | null>(null)
  const pdfNameRef = useRef<string>('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
  })

  if (status !== 'authenticated' || !session?.user?.id) {
    return null
  }
  const creatorId = session?.user.id

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: async files => {
      if (files?.length) {
        const file = files[0]
        const buffer = await file.arrayBuffer()
        setPdfFile(file)
        pdfBytesRef.current = buffer
        pdfNameRef.current = file.name
      }
    },
  })

  const analyzeMutation = useMutation({
    mutationFn: () => {
      if (!pdfBytesRef.current) throw new Error('ไม่พบไฟล์ PDF')
      const freshFile = new File([pdfBytesRef.current], pdfNameRef.current, {
        type: 'application/pdf',
      })
      return generateQuestions(
        form.title,
        freshFile,
        classroomId,
        creatorId,
        form.dueDate,
      )
    },
    onSuccess: result => {
      if (result.success && result.assignment?.chat_history?.length) {
        setAssignmentData({
          questions: result.assignment.chat_history,
          extractedText: result.assignment.generated_content ?? '',
          generatedTxt: result.assignment.generated_file_txt ?? '',
          answerFile: result.assignment.answer_file ?? null,
          filePdf: pdfNameRef.current,
        })
        setStep(3)
      } else {
        toast.error('ไม่พบคำถามจาก AI')
        setStep(1)
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'การวิเคราะห์ไฟล์ล้มเหลว')
      setStep(1)
    },
  })

  const regenerateMutation = useMutation({
    mutationFn: () =>
      regenerateQuestions(
        pdfNameRef.current,
        classroomId,
        creatorId,
        form.title,
      ),
    onSuccess: result => {
      if (result.success && result.assignment?.chat_history?.length) {
        setAssignmentData(prev => ({
          ...prev!,
          questions: result.assignment.chat_history,
          extractedText: result.assignment.generated_content ?? '',
          generatedTxt: result.assignment.generated_file_txt ?? '',
        }))
        toast.success('สร้างคำถามใหม่สำเร็จ')
      } else {
        toast.error('ไม่พบคำถามจาก AI')
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'สร้างคำถามใหม่ล้มเหลว')
    },
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      confirmAssignment({
        title: form.title,
        filePdf: assignmentData?.filePdf,
        classroomId,
        creatorId,
        dueDate: form.dueDate || undefined,
        generatedFileTxt: assignmentData?.generatedTxt,
        generatedContent: assignmentData?.extractedText,
        chatHistory: assignmentData?.questions ?? [],
        answerFile: assignmentData?.answerFile ?? undefined,
      }),
    onSuccess: () => {
      toast.success('มอบหมายงานสำเร็จ')
      handleClose()
    },
    onError: (error: any) => {
      toast.error(error?.message || 'บันทึกงานล้มเหลว')
    },
  })

  const handleClose = () => {
    setOpen(false)
    setStep(1)
    setForm({ title: '', description: '', dueDate: '' })
    setPdfFile(null)
    pdfBytesRef.current = null
    pdfNameRef.current = ''
    setAssignmentData(null)
    analyzeMutation.reset()
    regenerateMutation.reset()
    submitMutation.reset()
  }

  const handleNextStep = () => {
    if (!form.title.trim()) {
      return toast.error('กรุณากรอกชื่อหัวข้องาน')
    }
    if (!pdfBytesRef.current) {
      return toast.error('กรุณาแนบไฟล์ PDF เพื่อสร้างคำถาม')
    }
    setStep(2)
    analyzeMutation.mutate()
  }

  const onSubmit = () => {
    if (!assignmentData?.questions.length)
      return toast.error('ไม่มีคำถามสำหรับมอบหมายงาน')
    submitMutation.mutate()
  }

  return (
    <>
      <div className="flex h-full">
        <button
          className="btn btn-primary btn-sm h-full gap-2"
          onClick={() => setOpen(true)}
        >
          <MdOutlineAssignment className="h-4 w-4" />
          มอบหมายงานใหม่
        </button>
      </div>

      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl overflow-hidden">
            <div className="pyborder-b mb-3 flex items-center justify-between gap-2">
              {step === 3 ? (
                <div className="flex items-center gap-2">
                  <MdQuiz className="size-7 text-blue-600" />
                  <p className="text-xl font-bold">
                    ตรวจสอบคำถามที่ AI สร้างขึ้น
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MdOutlineAssignment className="size-7 text-blue-600" />
                  <p className="text-xl font-bold">สร้างงานใหม่ Assignment</p>
                </div>
              )}
            </div>

            {step === 1 && (
              <div className="grid gap-3 duration-300 animate-in fade-in">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="ชื่อการบ้าน*"
                  value={form.title}
                  onChange={e =>
                    setForm(prev => ({ ...prev, title: e.target.value }))
                  }
                />

                <textarea
                  className="textarea textarea-bordered h-24 w-full"
                  placeholder="อธิบายรายละเอียดงาน..."
                  value={form.description}
                  onChange={e =>
                    setForm(prev => ({ ...prev, description: e.target.value }))
                  }
                />

                <input
                  type="datetime-local"
                  className="input input-bordered w-full"
                  value={form.dueDate}
                  onChange={e =>
                    setForm(prev => ({ ...prev, dueDate: e.target.value }))
                  }
                />

                <div
                  {...getRootProps()}
                  className="flex min-h-40 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed text-center"
                >
                  <input {...getInputProps()} />
                  {pdfFile ? (
                    <p className="text-lg">{pdfFile.name}</p>
                  ) : (
                    <p className="text-lg text-gray-400">
                      กรุณา คลิกเพื่อเลือกไฟล์ของคุณ
                    </p>
                  )}
                </div>

                <div className="modal-action">
                  <button
                    className="rounded-lg bg-gray-200 px-3 py-2 shadow-sm duration-300 hover:bg-gray-300"
                    onClick={handleClose}
                  >
                    ยกเลิก
                  </button>
                  <button
                    className="rounded-lg bg-blue-600 px-3 py-2 text-white shadow-sm duration-300 hover:bg-blue-700"
                    onClick={handleNextStep}
                    disabled={analyzeMutation.isPending}
                  >
                    {analyzeMutation.isPending
                      ? 'กำลังวิเคราะห์...'
                      : 'สร้างคำถาม'}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex min-h-60 flex-col items-center justify-center gap-4">
                <span className="loading loading-spinner loading-lg bg-blue-300"></span>
                <p className="text-lg text-gray-500">กำลังวิเคราะห์ไฟล์...</p>
              </div>
            )}

            {step === 3 && (
              <div className="duration-300 animate-in slide-in-from-right">
                <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
                  {regenerateMutation.isPending ? (
                    <div className="flex flex-col items-center gap-4 py-16">
                      <span className="loading loading-spinner loading-lg bg-blue-300" />
                      <p className="text-lg text-gray-500">
                        AI กำลังสร้างคำถามใหม่...
                      </p>
                    </div>
                  ) : (assignmentData?.questions.length ?? 0) > 0 ? (
                    assignmentData?.questions.map((question, index) => (
                      <div key={index} className="rounded-lg border px-3 py-5">
                        <p className="flex gap-2">
                          <span className="text-blue-600">Q.{index + 1}</span>
                          {question.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-gray-400">
                      ไม่พบคำถาม
                    </div>
                  )}
                </div>

                <div className="modal-action flex justify-between">
                  <button
                    className="flex items-center gap-1 rounded-lg border border-blue-600 px-3 py-2 text-blue-600 duration-300 hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => regenerateMutation.mutate()}
                    disabled={
                      regenerateMutation.isPending || submitMutation.isPending
                    }
                  >
                    {regenerateMutation.isPending ? (
                      <>
                        <span className="loading loading-spinner loading-xs" />
                        กำลังสร้าง...
                      </>
                    ) : (
                      <>
                        <MdRefresh className="h-4 w-4" />
                        สร้างคำถามใหม่
                      </>
                    )}
                  </button>
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg bg-gray-200 px-3 py-2 shadow-sm duration-300 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setStep(1)}
                      disabled={
                        submitMutation.isPending || regenerateMutation.isPending
                      }
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      className="rounded-lg bg-blue-600 px-3 py-2 text-white shadow-sm duration-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={onSubmit}
                      disabled={
                        regenerateMutation.isPending || submitMutation.isPending
                      }
                    >
                      {submitMutation.isPending ? (
                        <>
                          <span className="loading loading-spinner loading-xs" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        'ยืนยันและมอบหมายงาน'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </dialog>
      )}
    </>
  )
}
