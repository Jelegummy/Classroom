import { JoinClassroom } from '@/services/classroom'
import { JoinClassroomArgs } from '@/services/classroom/types'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

export default function JoinButton() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<JoinClassroomArgs>({
    code: '',
  })

  const createClassroom = useMutation({
    mutationFn: (args: JoinClassroomArgs) => JoinClassroom(args),
    onSuccess: () => {
      toast.success('เข้าร่วมห้องเรียนสำเร็จ')
      setOpen(false)
      setForm({ code: '' })
    },
    onError: e => {
      toast.error(e?.message || 'เกิดข้อผิดพลาด')
    },
  })

  const onSubmit = () => {
    if (!form.code.trim()) {
      toast.error('กรุณากรอกรหัสห้องเรียน')
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
          + เข้าร่วมห้องเรียน
        </button>
      </div>

      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-4 text-lg font-bold">เข้าร่วมห้องเรียน</h3>
            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  รหัสห้องเรียน <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น XRA53A"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
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
                {createClassroom.isPending
                  ? 'กำลังเข้าร่วม...'
                  : 'เข้าร่วมห้องเรียน'}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  )
}
