import { createItems } from '@/services/Items'
import { CreateItemsArgs } from '@/services/Items/types'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

export default function CreateItems() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateItemsArgs>({
    name: '',
    description: '',
    price: 0,
    effectValue: 0,
    type: 'ATTACK_BOOST',
  })

  const createItemsMutation = useMutation({
    mutationFn: (args: CreateItemsArgs) => createItems(args),
    onSuccess: () => {
      toast.success('สร้างไอเทมสำเร็จ')
      setOpen(false)
      setForm({
        name: '',
        description: '',
        price: 0,
        effectValue: 0,
        type: 'ATTACK_BOOST',
      })
    },
    onError: e => {
      toast.error(e?.message || 'เกิดข้อผิดพลาด')
    },
  })

  const onSubmit = () => {
    if (!form.name.trim()) {
      toast.error('กรุณากรอกชื่อไอเทม')
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
          + สร้างไอเทมใหม่{' '}
        </button>
      </div>

      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-4 text-lg font-bold">สร้างไอเทมใหม่</h3>
            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  ชื่อไอเทม <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น ดาบบูสเตอร์"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  คำอธิบาย <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น ไอเทมที่จะเพิ่มพลังโจมตีให้กับตัวละครของคุณ"
                value={form.description}
                onChange={e =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  พลังโจมตี <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น 5"
                value={form.effectValue}
                onChange={e =>
                  setForm({ ...form, effectValue: Number(e.target.value) })
                }
              />
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  ราคา <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="เช่น 100"
                value={form.price}
                onChange={e =>
                  setForm({ ...form, price: Number(e.target.value) })
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
