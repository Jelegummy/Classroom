import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MdCheck, MdContentCopy } from 'react-icons/md'
import { toast } from 'sonner'
import { DeleteClassroomProps } from '../types'
import { deleteClassroom } from '@/services/classroom'
import { CiSettings } from 'react-icons/ci'

export default function DeleteClassroom({
  classroomId,
  name,
}: DeleteClassroomProps) {
  const [open, setOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [confirmId, setConfirmId] = useState('')
  const queryClient = useQueryClient()

  const deleteItemsMutation = useMutation({
    mutationFn: (classroomId: string) => deleteClassroom(classroomId),
    onSuccess: () => {
      toast.success('ลบคลาสรูมสำเร็จ')
      setOpen(false)
      setConfirmId('')
      queryClient.invalidateQueries({ queryKey: ['getAllClassrooms'] })
    },
    onError: e => {
      toast.error(e?.message || 'เกิดข้อผิดพลาดในการลบ')
    },
  })

  const isMatch = confirmId === name
  const onDelete = () => {
    if (isMatch) {
      deleteItemsMutation.mutate(classroomId)
    }
  }

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(true)
  }

  const handleCopy = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!name) return

    navigator.clipboard.writeText(name)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleClose = () => {
    setOpen(false)
    setConfirmId('')
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-all hover:bg-gray-100 hover:text-white"
        title="ลบคลาสรูม"
      >
        <CiSettings size={20} className="text-black" />
      </button>

      {open && (
        <dialog className="modal modal-open bg-black/40 backdrop-blur-sm">
          <div className="modal-box relative w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-4 top-4 text-gray-400 hover:text-gray-700"
              onClick={handleClose}
            >
              ✕
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  ยืนยันการลบคลาสรูม
                </h3>
                <p className="text-xs text-gray-500">
                  การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </div>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              เพื่อยืนยันการลบ กรุณาพิมพ์{' '}
              <span className="font-semibold text-gray-900">{name}</span>{' '}
              ด้านล่าง
            </p>

            <div className="mb-5 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <span className="select-all font-mono text-sm font-medium text-gray-700">
                {name}
              </span>

              <button
                onClick={handleCopy}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all active:scale-95 ${
                  isCopied
                    ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                    : 'bg-primary text-white shadow-md shadow-primary/30 hover:bg-blue-500'
                }`}
              >
                {isCopied ? (
                  <MdCheck className="h-4 w-4" />
                ) : (
                  <MdContentCopy className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={confirmId}
                onChange={e => setConfirmId(e.target.value)}
                placeholder={`พิมพ์ "${name}" เพื่อยืนยัน...`}
                className="input input-bordered w-full rounded-xl border-gray-200 bg-white text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                onClick={handleClose}
                disabled={deleteItemsMutation.isPending}
              >
                ยกเลิก
              </button>

              <button
                className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:bg-red-200 disabled:text-white/70"
                onClick={onDelete}
                disabled={!isMatch || deleteItemsMutation.isPending}
              >
                {deleteItemsMutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    กำลังลบ...
                  </>
                ) : (
                  'ยืนยันการลบ'
                )}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  )
}
