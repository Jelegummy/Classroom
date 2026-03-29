// import { analyzeAssignment, regenerateQuestions } from '@/services/assignment'
// import { useMutation } from '@tanstack/react-query'
// import { useState, useRef } from 'react'
// import { useDropzone } from 'react-dropzone'
// import { useSession } from 'next-auth/react'
// import { toast } from 'sonner'
// import { MdOutlineAssignment, MdQuiz, MdRefresh } from 'react-icons/md'

// interface ChatMessage {
//   role: string
//   content: string
// }

// export default function CreateButtonAssignment({
//   classroomId,
// }: {
//   classroomId: string
// }) {
//   const { data: session, status } = useSession()

//   const [open, setOpen] = useState(false)
//   const [step, setStep] = useState<1 | 2 | 3>(1)
//   const [pdfFile, setPdfFile] = useState<File | null>(null)
//   const pdfBytesRef = useRef<ArrayBuffer | null>(null)
//   const pdfNameRef = useRef<string>('')
//   const [questions, setQuestions] = useState<ChatMessage[]>([])
//   const [extractedText, setExtractedText] = useState('')
//   const [filePdf, setFilePdf] = useState<string | undefined>()

//   const [form, setForm] = useState({
//     title: '',
//     description: '',
//     dueDate: '',
//   })

//   if (status !== 'authenticated' || !session?.user?.id) {
//     return null
//   }

//   const creatorId = session.user.id

//   const getFreshFile = () => {
//     if (!pdfBytesRef.current) return null
//     return new File([pdfBytesRef.current], pdfNameRef.current, {
//       type: 'application/pdf',
//     })
//   }

//   const { getRootProps, getInputProps } = useDropzone({
//     accept: { 'application/pdf': ['.pdf'] },
//     maxFiles: 1,
//     onDrop: async files => {
//       if (files?.length) {
//         const file = files[0]
//         const buffer = await file.arrayBuffer()
//         setPdfFile(file)
//         pdfBytesRef.current = buffer
//         pdfNameRef.current = file.name
//       }
//     },
//   })

//   const analyzeMutation = useMutation({
//     mutationFn: () => {
//       const freshFile = getFreshFile()
//       if (!freshFile) throw new Error('ไม่พบไฟล์ PDF')
//       return analyzeAssignment(
//         form.title,
//         freshFile,
//         classroomId,
//         creatorId,
//         form.dueDate,
//       )
//     },

//     onSuccess: result => {
//       console.log('ANALYZE RESULT:', result)

//       if (result.success && result.assignment?.chat_history?.length) {
//         setQuestions(result.assignment.chat_history)
//         setExtractedText(result.assignment.generated_file_txt)
//         setFilePdf(pdfNameRef.current)
//         setStep(3)
//       } else {
//         toast.error('ไม่พบคำถามจาก AI')
//         setStep(1)
//       }
//     },

//     onError: (error: any) => {
//       toast.error(error?.message || 'การวิเคราะห์ไฟล์ล้มเหลว')
//       setStep(1)
//     },
//   })

//   const regenerateMutation = useMutation({
//     mutationFn: () =>
//       regenerateQuestions(pdfNameRef.current, classroomId, creatorId),
//     onSuccess: result => {
//       if (result.success && result.assignment?.chat_history?.length) {
//         setQuestions(result.assignment.chat_history)
//         toast.success('สร้างคำถามใหม่สำเร็จ')
//       } else {
//         toast.error('ไม่พบคำถามจาก AI')
//       }
//     },
//     onError: (error: any) => {
//       toast.error(error?.message || 'สร้างคำถามใหม่ล้มเหลว')
//     },
//   })

//   const handleClose = () => {
//     setOpen(false)
//     setStep(1)
//     setForm({ title: '', description: '', dueDate: '' })
//     setPdfFile(null)
//     pdfBytesRef.current = null
//     pdfNameRef.current = ''
//     setQuestions([])
//     setExtractedText('')
//     setFilePdf(undefined)
//     analyzeMutation.reset()
//     regenerateMutation.reset()
//   }

//   const handleNextStep = () => {
//     if (!form.title.trim()) {
//       return toast.error('กรุณากรอกชื่อหัวข้องาน')
//     }

//     if (!pdfBytesRef.current) {
//       return toast.error('กรุณาแนบไฟล์ PDF เพื่อสร้างคำถาม')
//     }

//     setStep(2)
//     analyzeMutation.mutate()
//   }

//   const onSubmit = () => {
//     if (!questions.length) {
//       return toast.error('ไม่มีคำถามสำหรับมอบหมายงาน')
//     }
//     toast.success('มอบหมายงานสำเร็จ')
//     handleClose()
//   }

//   return (
//     <>
//       <div className="flex h-full">
//         <button
//           className="btn btn-primary btn-sm h-full gap-2"
//           onClick={() => setOpen(true)}
//         >
//           <MdOutlineAssignment className="h-4 w-4" />
//           มอบหมายงานใหม่
//         </button>
//       </div>

//       {open && (
//         <dialog className="modal modal-open">
//           <div className="modal-box max-w-2xl overflow-hidden">
//             <div className="mb-2 flex items-center gap-2 border-b pb-3">
//               {step === 3 ? (
//                 <MdQuiz className="h-6 w-6 text-blue-600" />
//               ) : (
//                 <MdOutlineAssignment className="h-6 w-6 text-blue-600" />
//               )}
//               <h3 className="text-lg font-bold">
//                 {step === 3
//                   ? 'ตรวจสอบคำถามที่ AI สร้างขึ้น'
//                   : 'สร้างงานใหม่ (Assignment)'}
//               </h3>
//             </div>

//             {step === 1 && (
//               <div className="grid duration-300 animate-in fade-in">
//                 <input
//                   type="text"
//                   className="input input-bordered w-full"
//                   placeholder="ชื่อการบ้าน*"
//                   value={form.title}
//                   onChange={e =>
//                     setForm(prev => ({ ...prev, title: e.target.value }))
//                   }
//                 />

//                 <textarea
//                   className="textarea textarea-bordered mt-2 h-24 w-full"
//                   placeholder="อธิบายรายละเอียดงาน..."
//                   value={form.description}
//                   onChange={e =>
//                     setForm(prev => ({
//                       ...prev,
//                       description: e.target.value,
//                     }))
//                   }
//                 />

//                 <input
//                   type="datetime-local"
//                   className="input input-bordered mt-2 w-full"
//                   value={form.dueDate}
//                   onChange={e =>
//                     setForm(prev => ({
//                       ...prev,
//                       dueDate: e.target.value,
//                     }))
//                   }
//                 />

//                 <div
//                   {...getRootProps()}
//                   className="mt-4 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center"
//                 >
//                   <input {...getInputProps()} />
//                   {pdfFile ? (
//                     <p className="font-semibold">{pdfFile.name}</p>
//                   ) : (
//                     <p>ลากไฟล์ PDF มาวาง หรือคลิกเลือก</p>
//                   )}
//                 </div>

//                 <div className="modal-action">
//                   <button className="btn" onClick={handleClose}>
//                     ยกเลิก
//                   </button>
//                   <button
//                     className="btn btn-primary"
//                     onClick={handleNextStep}
//                     disabled={analyzeMutation.isPending}
//                   >
//                     {analyzeMutation.isPending ? 'กำลังวิเคราะห์...' : 'ถัดไป'}
//                   </button>
//                 </div>
//               </div>
//             )}

//             {step === 2 && (
//               <div className="flex flex-col items-center py-16">
//                 <span className="loading loading-spinner loading-lg"></span>
//                 <p className="mt-4">AI กำลังวิเคราะห์ไฟล์...</p>
//               </div>
//             )}

//             {step === 3 && (
//               <div className="duration-300 animate-in slide-in-from-right">
//                 <div className="mb-3 flex items-center justify-between">
//                   <span className="text-sm text-gray-500">
//                     คำถามทั้งหมด {questions.length} ข้อ
//                   </span>
//                   <button
//                     className="btn btn-outline btn-sm gap-2"
//                     onClick={() => regenerateMutation.mutate()}
//                     disabled={regenerateMutation.isPending}
//                   >
//                     {regenerateMutation.isPending ? (
//                       <>
//                         <span className="loading loading-spinner loading-xs" />
//                         กำลังสร้าง...
//                       </>
//                     ) : (
//                       <>
//                         <MdRefresh className="h-4 w-4" />
//                         สร้างคำถามใหม่
//                       </>
//                     )}
//                   </button>
//                 </div>

//                 <div className="max-h-[350px] space-y-3 overflow-y-auto pr-2">
//                   {regenerateMutation.isPending ? (
//                     <div className="flex flex-col items-center py-16">
//                       <span className="loading loading-spinner loading-lg" />
//                       <p className="mt-4 text-sm text-gray-500">
//                         AI กำลังสร้างคำถามใหม่...
//                       </p>
//                     </div>
//                   ) : questions.length > 0 ? (
//                     questions.map((question, index) => (
//                       <div key={index} className="rounded-lg border p-3">
//                         <span className="text-xs font-bold text-primary">
//                           คำถามที่ {index + 1}
//                         </span>
//                         <p className="mt-1 text-sm">{question.content}</p>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="py-10 text-center text-gray-400">
//                       ไม่พบคำถาม
//                     </div>
//                   )}
//                 </div>

//                 <div className="modal-action mt-6">
//                   <button className="btn btn-ghost" onClick={() => setStep(1)}>
//                     ย้อนกลับ
//                   </button>
//                   <button
//                     className="btn btn-primary"
//                     onClick={onSubmit}
//                     disabled={regenerateMutation.isPending}
//                   >
//                     ยืนยันและมอบหมายงาน
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           <form
//             method="dialog"
//             className="modal-backdrop"
//             onClick={handleClose}
//           >
//             <button>close</button>
//           </form>
//         </dialog>
//       )}
//     </>
//   )
// }

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

export default function CreateButtonAssignment({
  classroomId,
}: {
  classroomId: string
}) {
  const { data: session, status } = useSession()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const pdfBytesRef = useRef<ArrayBuffer | null>(null)
  const pdfNameRef = useRef<string>('')

  const [questions, setQuestions] = useState<ChatMessage[]>([])
  const [extractedText, setExtractedText] = useState('')
  const [generatedTxt, setGeneratedTxt] = useState('')
  const [answerFile, setAnswerFile] = useState<
    { answer: string; question: string }[] | null
  >(null)
  const [filePdf, setFilePdf] = useState<string | undefined>()

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
  })

  if (status !== 'authenticated' || !session?.user?.id) {
    return null
  }

  const creatorId = session.user.id

  const getFreshFile = () => {
    if (!pdfBytesRef.current) return null
    return new File([pdfBytesRef.current], pdfNameRef.current, {
      type: 'application/pdf',
    })
  }

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

  // generate คำถาม — ไม่ save DB
  const analyzeMutation = useMutation({
    mutationFn: () => {
      const freshFile = getFreshFile()
      if (!freshFile) throw new Error('ไม่พบไฟล์ PDF')
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
        setQuestions(result.assignment.chat_history)
        setExtractedText(result.assignment.generated_content ?? '')
        setGeneratedTxt(result.assignment.generated_file_txt ?? '')
        setAnswerFile(result.assignment.answer_file ?? null)
        setFilePdf(pdfNameRef.current)
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

  // regenerate คำถามใหม่ — ไม่ save DB
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
        setQuestions(result.assignment.chat_history)
        setAnswerFile(result.assignment.answer_file ?? null)
        toast.success('สร้างคำถามใหม่สำเร็จ')
      } else {
        toast.error('ไม่พบคำถามจาก AI')
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'สร้างคำถามใหม่ล้มเหลว')
    },
  })

  // save DB ครั้งเดียวตอนกด "ยืนยัน"
  const submitMutation = useMutation({
    mutationFn: () =>
      confirmAssignment({
        title: form.title,
        filePdf: filePdf,
        classroomId,
        creatorId,
        dueDate: form.dueDate || undefined,
        generatedFileTxt: generatedTxt,
        generatedContent: extractedText,
        chatHistory: questions,
        answerFile: answerFile ?? undefined,
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
    setQuestions([])
    setExtractedText('')
    setGeneratedTxt('')
    setAnswerFile(null)
    setFilePdf(undefined)
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
    if (!questions.length) return toast.error('ไม่มีคำถามสำหรับมอบหมายงาน')
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
            <div className="mb-2 flex items-center gap-2 border-b pb-3">
              {step === 3 ? (
                <MdQuiz className="h-6 w-6 text-blue-600" />
              ) : (
                <MdOutlineAssignment className="h-6 w-6 text-blue-600" />
              )}
              <h3 className="text-lg font-bold">
                {step === 3
                  ? 'ตรวจสอบคำถามที่ AI สร้างขึ้น'
                  : 'สร้างงานใหม่ (Assignment)'}
              </h3>
            </div>

            {step === 1 && (
              <div className="grid duration-300 animate-in fade-in">
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
                  className="textarea textarea-bordered mt-2 h-24 w-full"
                  placeholder="อธิบายรายละเอียดงาน..."
                  value={form.description}
                  onChange={e =>
                    setForm(prev => ({ ...prev, description: e.target.value }))
                  }
                />

                <input
                  type="datetime-local"
                  className="input input-bordered mt-2 w-full"
                  value={form.dueDate}
                  onChange={e =>
                    setForm(prev => ({ ...prev, dueDate: e.target.value }))
                  }
                />

                <div
                  {...getRootProps()}
                  className="mt-4 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center"
                >
                  <input {...getInputProps()} />
                  {pdfFile ? (
                    <p className="font-semibold">{pdfFile.name}</p>
                  ) : (
                    <p>ลากไฟล์ PDF มาวาง หรือคลิกเลือก</p>
                  )}
                </div>

                <div className="modal-action">
                  <button className="btn" onClick={handleClose}>
                    ยกเลิก
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleNextStep}
                    disabled={analyzeMutation.isPending}
                  >
                    {analyzeMutation.isPending ? 'กำลังวิเคราะห์...' : 'ถัดไป'}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col items-center py-16">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-4">AI กำลังวิเคราะห์ไฟล์...</p>
              </div>
            )}

            {step === 3 && (
              <div className="duration-300 animate-in slide-in-from-right">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    คำถามทั้งหมด {questions.length} ข้อ
                  </span>
                  <button
                    className="btn btn-outline btn-sm gap-2"
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
                </div>

                <div className="max-h-[350px] space-y-3 overflow-y-auto pr-2">
                  {regenerateMutation.isPending ? (
                    <div className="flex flex-col items-center py-16">
                      <span className="loading loading-spinner loading-lg" />
                      <p className="mt-4 text-sm text-gray-500">
                        AI กำลังสร้างคำถามใหม่...
                      </p>
                    </div>
                  ) : questions.length > 0 ? (
                    questions.map((question, index) => (
                      <div key={index} className="rounded-lg border p-3">
                        <span className="text-xs font-bold text-primary">
                          คำถามที่ {index + 1}
                        </span>
                        <p className="mt-1 text-sm">{question.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-gray-400">
                      ไม่พบคำถาม
                    </div>
                  )}
                </div>

                <div className="modal-action mt-6">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setStep(1)}
                    disabled={submitMutation.isPending}
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    className="btn btn-primary"
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
            )}
          </div>

          <form
            method="dialog"
            className="modal-backdrop"
            onClick={handleClose}
          >
            <button>close</button>
          </form>
        </dialog>
      )}
    </>
  )
}
