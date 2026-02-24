import { createTutor } from '@/services/tutor'
import { CreateTutorArgs } from '@/services/tutor/types'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

interface CreateButtonTutorProps {
  classroomId: string
}

export default function CreateButtonTutor(props: CreateButtonTutorProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateTutorArgs>({
    discordChannelId: '',
    startTime: new Date(Date.now()),
    classroomId: props.classroomId,
  })

  const [successOpen, setSuccessOpen] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')

  const createTutorMutation = useMutation({
    mutationFn: (args: CreateTutorArgs) => createTutor(args),
    onSuccess: data => {
      toast.success('สร้างที่ปรึกษาสำเร็จ')
      setOpen(false)
      setForm({
        discordChannelId: '',
        startTime: new Date(Date.now()),
        classroomId: props.classroomId,
      })

      const link =
        'https://discord.com/oauth2/authorize?client_id=1444353472362451047&permissions=8&integration_type=0&scope=bot'

      setGeneratedLink(link)
      setSuccessOpen(true)
    },
    onError: e => {
      toast.error(e?.message || 'เกิดข้อผิดพลาด')
    },
  })

  const onSubmit = () => {
    if (!form.discordChannelId) {
      toast.error('กรุณากรอก Discord Channel ID')
      return
    }
    createTutorMutation.mutate(form)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      toast.success('คัดลอกลิ้งก์สำเร็จ!')
    } catch (err) {
      toast.error('ไม่สามารถคัดลอกลิ้งก์ได้')
    }
  }

  return (
    <>
      <div className="flex">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setOpen(true)}
        >
          + ขอรับลิ้งก์
        </button>
      </div>

      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-4 text-lg font-bold">ขอรับลิ้งก์ Bot Discord</h3>
            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  Discord Channel ID <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น 123456789012345678"
                value={form.discordChannelId}
                onChange={e =>
                  setForm({ ...form, discordChannelId: e.target.value })
                }
              />
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">วันที่เริ่มต้น</span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered w-full"
                value={form.startTime!.toISOString().slice(0, 16)}
                onChange={e =>
                  setForm({ ...form, startTime: new Date(e.target.value) })
                }
              />
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={createTutorMutation.isPending}
              >
                {createTutorMutation.isPending ? 'กำลังสร้าง...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </dialog>
      )}

      {successOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-4 text-lg font-bold text-success">
              สร้างสำเร็จ!
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              กรุณาคัดลอกลิ้งก์ด้านล่างเพื่อนำไปเชิญ Bot เข้าสู่ Discord Channel
              ของคุณ
            </p>

            <div className="mb-2 flex gap-2">
              <input
                type="text"
                className="input input-bordered w-full bg-base-200"
                value={generatedLink}
                readOnly
              />
              <button className="btn btn-primary" onClick={copyToClipboard}>
                Copy
              </button>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost hover:bg-error"
                onClick={() => setSuccessOpen(false)}
              >
                ปิด
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  )
}
