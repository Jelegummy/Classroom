import { createCharacter } from '@/services/charecter'
import { CreateCharacter } from '@/services/charecter/types'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

export default function CreateCharacterPage() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateCharacter>({
    bossName: '',
    pointBoss: 0,
    modelUrl: '',
    imageUrl: '',
  })

  const createItemsMutation = useMutation({
    mutationFn: (args: CreateCharacter) => createCharacter(args),
    onSuccess: () => {
      toast.success('สร้างตัวละครสำเร็จ')
      setOpen(false)
      setForm({
        bossName: '',
        pointBoss: 0,
        modelUrl: '',
        imageUrl: '',
      })
    },
    onError: e => {
      toast.error(e?.message || 'เกิดข้อผิดพลาด')
    },
  })

  const onSubmit = () => {
    if (!form.bossName.trim()) {
      toast.error('กรุณากรอกชื่อตัวละคร')
      return
    }
    if (!form.pointBoss || form.pointBoss <= 0) {
      toast.error('กรุณากรอกคะแนนสำหรับ Boss')
      return
    }

    createItemsMutation.mutate(form)
  }

  return (
    <>
      <div className="flex">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setOpen(true)}
        >
          + สร้างตัวละครใหม่{' '}
        </button>
      </div>

      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-4 text-lg font-bold">สร้างตัวละครใหม่</h3>
            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  ชื่อตัวละคร <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น บูสเตอร์"
                value={form.bossName}
                onChange={e => setForm({ ...form, bossName: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  คะแนนสำหรับ Boss <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น ตัวละครที่มีพลังโจมตีสูง"
                value={form.pointBoss}
                onChange={e =>
                  setForm({ ...form, pointBoss: Number(e.target.value) })
                }
              />
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  ลิ้งก์ Model <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น https://pub-10de472ef8d2442881c7be671b9b1e32.r2.dev/model/wild-wolf.glb"
                value={form.modelUrl}
                onChange={e => setForm({ ...form, modelUrl: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  ลิ้งก์ Image <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น https://pub-10de472ef8d2442881c7be671b9b1e32.r2.dev/image/wild-wolf.png"
                value={form.imageUrl}
                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
              />
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={createItemsMutation.isPending}
              >
                {createItemsMutation.isPending ? 'กำลังสร้าง...' : 'สร้างไอเทม'}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  )
}
