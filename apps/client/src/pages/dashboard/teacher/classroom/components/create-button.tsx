import { CreateClassRoom } from '@/services/classroom'
import { CreateClassroom } from '@/services/classroom/types'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

export default function CreateButton() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateClassroom>({
    name: '',
    title: '',
  })

  const createClassroom = useMutation({
    mutationFn: (args: CreateClassroom) => CreateClassRoom(args),
    onSuccess: () => {
      toast.success('สร้างห้องเรียนสำเร็จ')
      setOpen(false)
      setForm({ name: '', title: '' })
    },
    onError: e => {
      toast.error(e?.message || 'เกิดข้อผิดพลาด')
    },
  })

  const onSubmit = () => {
    if (!form.name.trim()) {
      toast.error('กรุณากรอกชื่อห้องเรียน')
      return
    }

    createClassroom.mutate(form)
  }

  return (
    <>
      <div className="flex">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setOpen(true)}
        >
          + เพิ่มห้องเรียน
        </button>
      </div>

      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-4 text-lg font-bold">สร้างห้องเรียนใหม่</h3>
            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  ชื่อห้องเรียน <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น วิชา Numerical Methods"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">คำอธิบาย</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น ห้องเรียนสำหรับวิชา Numerical Methods"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={createClassroom.isPending}
              >
                {createClassroom.isPending ? 'กำลังสร้าง...' : 'สร้างห้องเรียน'}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  )
}
