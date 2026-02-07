import { createAnnounce } from '@/services/announce'
import { CreateAnnounceArgs } from '@/services/announce/types'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { BiBookAdd } from 'react-icons/bi'

export default function CreateButtonAnnounce({
  classroomId,
}: {
  classroomId: string
}) {
  const [open, setOpen] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: files => {
      setPdfFile(files[0])
    },
  })

  const [form, setForm] = useState<Omit<CreateAnnounceArgs, 'classroomId'>>({
    title: '',
    message: '',
    filePdf: '',
  })

  const files = acceptedFiles.map(file => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
    </li>
  ))

  const CreateAnnounce = useMutation({
    mutationFn: (args: CreateAnnounceArgs) => createAnnounce(args),
    onSuccess: () => {
      toast.success('สร้างประกาศสำเร็จ')
      setOpen(false)
      setForm({ message: '', title: '', filePdf: '' })
    },
    onError: e => {
      toast.error(e?.message || 'เกิดข้อผิดพลาด')
    },
  })

  const onSubmit = () => {
    if (!form.title.trim()) {
      toast.error('กรุณากรอกหัวข้อประกาศ')
      return
    }
    if (!form.message.trim()) {
      toast.error('กรุณากรอกเนื้อหาประกาศ')
      return
    }

    CreateAnnounce.mutate({
      ...form,
      classroomId,
    })
  }

  return (
    <>
      <div className="flex">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setOpen(true)}
        >
          + เพิ่มประกาศใหม่
        </button>
      </div>

      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <div className="flex flex-row items-center gap-2">
              <BiBookAdd className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold">สร้างประกาศใหม่</h3>
            </div>
            <div className="mt-3">
              <label className="label">
                <span className="label-text">
                  หัวข้อประกาศ <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น การส่งงานสำหรับ ..."
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  เนื้อหาประกาศ <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น เนื้อหาประกาศ ..."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">ไฟล์ PDF (ถ้ามี)</span>
              </label>

              <div
                {...getRootProps()}
                className="cursor-pointer rounded-lg border-2 border-dashed border-base-300 p-6 text-center hover:bg-base-200"
              >
                <input {...getInputProps()} />
                {pdfFile ? (
                  <p className="text-sm text-success">{pdfFile.name}</p>
                ) : (
                  <p className="text-sm text-base-content/60">
                    ลากไฟล์ PDF มาวาง หรือคลิกเพื่อเลือกไฟล์
                  </p>
                )}
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-outline btn-error"
                onClick={() => setOpen(false)}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={CreateAnnounce.isPending}
              >
                {CreateAnnounce.isPending ? 'กำลังสร้าง...' : 'สร้างประกาศ'}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  )
}
