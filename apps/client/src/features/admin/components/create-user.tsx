import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createUser, CreateUserArgs } from '@/services/user'

export default function CreateUser() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateUserArgs>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT',
    schoolId: '',
    schoolName: '',
  })

  const createUserMutation = useMutation({
    mutationFn: (args: CreateUserArgs) => createUser(args),
    onSuccess: () => {
      toast.success('สร้างผู้ใช้สำเร็จ')
      setOpen(false)
      // รีเซ็ตฟอร์ม
      setForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'STUDENT',
        schoolId: '',
        schoolName: '',
      })
    },
    onError: (e: any) => {
      toast.error(e?.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้')
    },
  })

  const onSubmit = () => {
    // Basic validation ตามที่จำเป็น
    if (
      !form.email.trim() ||
      !form.password.trim() ||
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
      return
    }

    if (form.password.length < 8) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }

    // ลบค่า schoolId/schoolName ออกหากเป็นค่าว่าง (เพื่อให้ตรงกับ .optional() ใน Zod)
    const payload = { ...form }
    if (!payload.schoolId) delete payload.schoolId
    if (!payload.schoolName) delete payload.schoolName

    createUserMutation.mutate(payload)
  }

  return (
    <>
      <div className="flex p-4">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setOpen(true)}
        >
          + สร้างผู้ใช้ใหม่
        </button>
      </div>

      {open && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-4 text-lg font-bold">สร้างผู้ใช้ใหม่</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="mb-3">
                <label className="label">
                  <span className="label-text">
                    ชื่อจริง <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="ชื่อ"
                  value={form.firstName}
                  onChange={e =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="label">
                  <span className="label-text">
                    นามสกุล <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="นามสกุล"
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  อีเมล <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="example@mail.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  รหัสผ่าน <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="label">
                <span className="label-text">
                  บทบาท (Role) <span className="text-error">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={form.role}
                onChange={e =>
                  setForm({
                    ...form,
                    role: e.target.value as CreateUserArgs['role'],
                  })
                }
              >
                <option value="STUDENT">นักเรียน (STUDENT)</option>
                <option value="TEACHER">ครู (TEACHER)</option>
                <option value="ADMIN">แอดมิน (ADMIN)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="mb-3">
                <label className="label">
                  <span className="label-text">รหัสโรงเรียน (ถ้ามี)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="School ID"
                  value={form.schoolId}
                  onChange={e => setForm({ ...form, schoolId: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="label">
                  <span className="label-text">ชื่อโรงเรียน (ถ้ามี)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="School Name"
                  value={form.schoolName}
                  onChange={e =>
                    setForm({ ...form, schoolName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={onSubmit}
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  )
}
