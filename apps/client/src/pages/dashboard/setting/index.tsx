import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import {
  updatePassword,
  UpdatePasswordArgs,
  updateUser,
  UpdateUserArgs,
} from '@/services/user'
import { useMutation } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { SquarePen, Save, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'

type PasswordFormValues = UpdatePasswordArgs & {
  confirmNewPassword?: string
}

export default function Setting() {
  const { data: session, update } = useSession()
  const user = session?.user

  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const passwordForm = useForm<PasswordFormValues>()

  const userForm = useForm<UpdateUserArgs>()

  useEffect(() => {
    if (user) {
      userForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
      })
    }
  }, [user, userForm])

  const updateUserMutation = useMutation({
    mutationFn: (args: UpdateUserArgs) => updateUser(args),
    onSuccess: () => {
      update()
      setIsEditingProfile(false)
      toast.success('อัปเดตข้อมูลสำเร็จ')
    },
    onError: error => {
      toast.error(
        'เกิดข้อผิดพลาดในการอัปเดตข้อมูล: ' + (error as Error).message,
      )
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: (args: UpdatePasswordArgs) => updatePassword(args),
    onSuccess: () => {
      passwordForm.reset()
      toast.success('อัปเดตรหัสผ่านสำเร็จ')
    },
    onError: error => {
      toast.error(
        'เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน: ' + (error as Error).message,
      )
    },
  })

  const onSubmitPassword = (data: PasswordFormValues) => {
    if (data.newPassword !== data.confirmNewPassword) {
      toast.error('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }
    const payload: UpdatePasswordArgs = {
      oldpassword: data.oldpassword,
      newPassword: data.newPassword,
    }
    updatePasswordMutation.mutate(payload)
  }

  const onSubmitUser = (data: UpdateUserArgs) => {
    updateUserMutation.mutate(data)
  }

  return (
    <AppLayout>
      <DashboardLayout>
        <div className="mx-auto mt-4 max-w-5xl space-y-4 p-4 sm:mt-16 sm:space-y-6 sm:p-6">
          <h1 className="mb-4 text-xl font-bold sm:mb-8 sm:text-2xl">
            การตั้งค่า
          </h1>

          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-200 sm:h-16 sm:w-16">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
                      'User',
                  )}&background=random`}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h2 className="break-all text-lg font-semibold sm:text-xl">
                  {user?.name || `${user?.firstName} ${user?.lastName}`}
                </h2>
                <p className="text-sm text-gray-500">
                  {user?.role || 'Teacher'}
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={userForm.handleSubmit(onSubmitUser)}
            className="flex flex-col rounded-2xl border bg-white p-4 shadow-sm sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold sm:text-xl">ข้อมูลส่วนตัว</h3>
              {!isEditingProfile && (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1.5 text-sm text-blue-600 transition hover:bg-blue-200 sm:px-4 sm:py-2 sm:text-base"
                >
                  <SquarePen size={18} />
                  <span>แก้ไข</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-400">ชื่อ</label>
                {isEditingProfile ? (
                  <input
                    {...userForm.register('firstName')}
                    className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-800">
                    {user?.firstName || '-'}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  นามสกุล
                </label>
                {isEditingProfile ? (
                  <input
                    {...userForm.register('lastName')}
                    className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-800">
                    {user?.lastName || '-'}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  อีเมล (ไม่สามารถแก้ไขได้)
                </label>
                <p className="break-all font-medium text-gray-800">
                  {user?.email || 'email@example.com'}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  เบอร์โทรศัพท์
                </label>
                {isEditingProfile ? (
                  <input
                    {...userForm.register('phoneNumber')}
                    className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-800">
                    {user?.phoneNumber || '-'}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  โรงเรียน
                </label>
                <p className="font-medium text-gray-800">school name</p>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  บทบาท
                </label>
                <p className="font-medium text-gray-800">
                  {user?.role || 'ครู'}
                </p>
              </div>
            </div>

            {isEditingProfile && (
              <div className="mt-8 flex justify-end gap-3 border-t pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false)
                    userForm.reset()
                  }}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-600 transition hover:bg-gray-200"
                >
                  <X size={18} />
                  <span>ยกเลิก</span>
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-blue-600 transition hover:bg-blue-200 disabled:opacity-50"
                >
                  <Save size={18} />
                  <span>
                    {updateUserMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                  </span>
                </button>
              </div>
            )}
          </form>

          <form
            onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
            className="flex flex-col rounded-2xl border bg-white p-4 shadow-sm sm:p-8"
          >
            <h3 className="mb-6 text-lg font-bold sm:text-xl">รหัสผ่าน</h3>
            <div className="max-w-sm space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  รหัสผ่านเดิม
                </label>
                <input
                  type="password"
                  required
                  {...passwordForm.register('oldpassword')}
                  className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  required
                  {...passwordForm.register('newPassword')}
                  className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  รหัสผ่านใหม่ (ยืนยัน)
                </label>
                <input
                  type="password"
                  required
                  {...passwordForm.register('confirmNewPassword')}
                  className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end pt-6">
              <button
                type="submit"
                disabled={updatePasswordMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-blue-600 transition hover:bg-blue-200 disabled:opacity-50"
              >
                <Save size={18} />
                <span>
                  {updatePasswordMutation.isPending
                    ? 'กำลังบันทึก...'
                    : 'บันทึก'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AppLayout>
  )
}
