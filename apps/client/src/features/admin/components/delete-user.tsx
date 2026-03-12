import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MdCheck, MdContentCopy, MdDeleteOutline } from 'react-icons/md'
import { toast } from 'sonner'
import { DeleteUserArgs } from '../types'
import { deleteUser } from '@/services/user'

export default function DeleteUser({ userId, email }: DeleteUserArgs) {
  const [open, setOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [confirmId, setConfirmId] = useState('')
  const queryClient = useQueryClient()

  const deleteItemsMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      toast.success('ลบผู้ใช้สำเร็จ')
      setOpen(false)
      setConfirmId('')
      queryClient.invalidateQueries({ queryKey: ['getAllUsers'] })
    },
    onError: e => {
      toast.error(e?.message || 'เกิดข้อผิดพลาดในการลบ')
    },
  })

  const isMatch = confirmId === email
  const onDelete = () => {
    if (isMatch) {
      deleteItemsMutation.mutate(userId)
    }
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(true)
  }

  const handleCopy = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!email) return

    navigator.clipboard.writeText(email)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleClose = () => {
    if (deleteItemsMutation.isPending) return
    setOpen(false)
    setConfirmId('')
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-all hover:bg-red-500 hover:text-white"
        title="ลบผู้ใช้"
      >
        <MdDeleteOutline size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <button
              className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-700"
              onClick={handleClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="mb-6 text-center">
              <h3 className="mb-1 text-xl font-bold text-gray-900">
                ยืนยันการลบผู้ใช้
              </h3>
              <p className="text-sm text-gray-500">
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>

            <p className="mb-4 text-center text-sm leading-relaxed text-gray-700">
              เพื่อยืนยันการลบ กรุณาพิมพ์{' '}
              <span className="font-semibold text-gray-900">{email}</span>{' '}
              ด้านล่าง
            </p>

            <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-2 pl-4 shadow-sm">
              <span className="mr-3 select-all truncate font-mono text-sm font-medium text-gray-700">
                {email}
              </span>

              <button
                onClick={handleCopy}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all ${
                  isCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-[#4361EE] text-white hover:bg-blue-600'
                }`}
              >
                {isCopied ? (
                  <MdCheck className="h-5 w-5" />
                ) : (
                  <MdContentCopy className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="mb-8">
              <input
                type="text"
                value={confirmId}
                onChange={e => setConfirmId(e.target.value)}
                placeholder={`พิมพ์ "${email}" เพื่อยืนยัน...`}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-[#4361EE] focus:outline-none focus:ring-1 focus:ring-[#4361EE]"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                onClick={handleClose}
                disabled={deleteItemsMutation.isPending}
              >
                ยกเลิก
              </button>

              <button
                className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
                  isMatch && !deleteItemsMutation.isPending
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'cursor-not-allowed bg-red-100 text-red-300'
                }`}
                onClick={onDelete}
                disabled={!isMatch || deleteItemsMutation.isPending}
              >
                {deleteItemsMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs border-2 border-current"></span>
                    กำลังลบ...
                  </>
                ) : (
                  'ยืนยันการลบ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
