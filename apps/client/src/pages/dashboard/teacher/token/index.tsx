'use client'

import { useState, useRef, useEffect } from 'react'
import AppLayout from '@/components/Layouts/App'
import DashboardLayout from '@/components/Layouts/Dashboard'
import { uploadSlip } from '@/services/token'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  UploadCloud,
  Wallet,
  ImageIcon,
  X,
  CheckCircle2,
  Coins,
  Zap,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import NavbarPayment from '@/components/NavbarContent/navbar-payment'

const PROMPTPAY_ID = '1160101866141'

const TOKEN_PACKAGES = [
  { id: 'pkg-1', price: 10, tokens: 100, popular: false },
  { id: 'pkg-2', price: 100, tokens: 1010, popular: false },
  { id: 'pkg-3', price: 300, tokens: 3100, popular: true },
  { id: 'pkg-4', price: 500, tokens: 5000, popular: false },
  { id: 'pkg-5', price: 1000, tokens: 10000, popular: false },
]

const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

interface UploadSlipArgs {
  slip: string
  id: string
}

export default function TokenPage() {
  const { data: session } = useSession()
  const [selectedPkg, setSelectedPkg] = useState<
    (typeof TOKEN_PACKAGES)[0] | null
  >(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userId = session?.user?.id as string

  useEffect(() => {
    if (selectedPkg) {
      setIsGeneratingQR(true)
      const timer = setTimeout(() => setIsGeneratingQR(false), 800)
      return () => clearTimeout(timer)
    }
  }, [selectedPkg])

  const uploadSlipMutation = useMutation({
    mutationFn: (args: UploadSlipArgs) => uploadSlip(args),
    onSuccess: () => {
      toast.success('อัปโหลดสลิปสำเร็จ ระบบกำลังเพิ่ม Token ให้คุณ')
      handleClearFile()
      setSelectedPkg(null)
    },
    onError: e => {
      toast.error(e?.message || 'เกิดข้อผิดพลาดในการอัปโหลดสลิป')
    },
  })

  const handleFileChange = (selectedFile: File | undefined | null) => {
    if (!selectedPkg) {
      toast.error('กรุณาเลือกแพ็กเกจที่ต้องการเติมก่อนครับ')
      return
    }
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น')
        return
      }
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleClearFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!file || !selectedPkg) return
    try {
      const base64Image = await toBase64(file)
      uploadSlipMutation.mutate({ slip: base64Image, id: userId })
    } catch (error) {
      toast.error('ไม่สามารถอ่านไฟล์ภาพได้')
    }
  }

  return (
    <AppLayout>
      <DashboardLayout>
        <NavbarPayment UserId={userId} />
        <div className="mx-4 mt-8 flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:mx-8 sm:mt-8 sm:p-8">
          <div className="mb-10 flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-extrabold text-gray-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                  <Coins className="h-6 w-6" />
                </div>
                เติม Tokens
              </h1>
              <p className="mt-3 text-gray-500">
                เลือกแพ็กเกจที่ต้องการ สแกนจ่าย และแนบสลิปเพื่อรับ Token ทันที
              </p>
            </div>

            <div className="flex flex-col items-end rounded-2xl bg-gray-50 p-4 px-6 ring-1 ring-gray-200">
              <span className="text-sm font-medium text-gray-500">
                ยอดชำระเงิน (THB)
              </span>
              <span className="text-3xl font-black text-blue-600">
                {selectedPkg
                  ? `฿${selectedPkg.price.toLocaleString()}`
                  : '฿0.00'}
              </span>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TOKEN_PACKAGES.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 p-4 transition-all duration-200 ${
                      selectedPkg?.id === pkg.id
                        ? 'scale-[1.02] border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10'
                        : 'border-gray-100 bg-white hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-3 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <Zap className="h-3 w-3 fill-current" />
                        คุ้มที่สุด
                      </span>
                    )}
                    <span className="text-xl font-black text-gray-800">
                      {pkg.tokens.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      Tokens
                    </span>
                    <div
                      className={`mt-2 w-full rounded-lg py-1.5 text-center text-sm font-bold transition-colors ${
                        selectedPkg?.id === pkg.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      ฿{pkg.price}
                    </div>
                  </button>
                ))}
              </div>

              <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-gray-100 bg-gray-50 p-8">
                {!selectedPkg ? (
                  <div className="flex flex-col items-center text-gray-400">
                    <Wallet className="mb-4 h-16 w-16 opacity-50" />
                    <p className="font-medium">กรุณาเลือกแพ็กเกจด้านบน</p>
                    <p className="text-sm">เพื่อสร้าง QR Code สำหรับชำระเงิน</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center duration-300 animate-in fade-in zoom-in">
                    <div className="mb-4 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-bold text-blue-700">
                      ชำระผ่านพร้อมเพย์
                    </div>

                    <div className="relative rounded-2xl bg-white p-4 shadow-xl shadow-gray-200/50 ring-1 ring-gray-200">
                      {isGeneratingQR ? (
                        <div className="flex h-[200px] w-[200px] items-center justify-center">
                          <svg
                            className="h-8 w-8 animate-spin text-blue-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={`https://promptpay.io/${PROMPTPAY_ID}/${selectedPkg.price}.png`}
                          alt="PromptPay QR"
                          className="h-[200px] w-[200px] object-contain"
                        />
                      )}
                    </div>
                    <p className="mt-6 text-sm font-medium text-gray-500">
                      ชื่อบัญชี: จีระศักดิ์​ ดาระดาษ (ธ.กรุงไทย)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`flex flex-col rounded-3xl border p-6 transition-colors duration-300 sm:p-8 ${
                selectedPkg
                  ? 'border-blue-100 bg-blue-50/30'
                  : 'border-gray-100 bg-gray-50/50 opacity-60 grayscale-[0.5]'
              }`}
            >
              <div className="mb-6 flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${selectedPkg ? 'bg-blue-600' : 'bg-gray-400'}`}
                >
                  2
                </span>
                <h2 className="text-xl font-bold text-gray-800">
                  แนบสลิปการโอนเงิน
                </h2>
              </div>

              {!preview ? (
                <div
                  className={`flex min-h-[320px] flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 ${
                    !selectedPkg
                      ? 'cursor-not-allowed border-gray-200 bg-gray-100/50'
                      : isDragging
                        ? 'scale-[0.99] border-blue-500 bg-blue-100/50'
                        : 'border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                  onDragOver={e => {
                    e.preventDefault()
                    if (selectedPkg) setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setIsDragging(false)
                    if (selectedPkg) handleFileChange(e.dataTransfer.files[0])
                  }}
                  onClick={() => selectedPkg && fileInputRef.current?.click()}
                >
                  <div
                    className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full ring-8 ${selectedPkg ? 'bg-blue-50 text-blue-600 ring-blue-50/50' : 'bg-gray-100 text-gray-400 ring-gray-100'}`}
                  >
                    <UploadCloud className="h-10 w-10" />
                  </div>
                  <p className="text-lg font-bold text-gray-700">
                    อัปโหลดรูปภาพสลิป
                  </p>
                  <p className="mt-2 text-center text-sm font-medium text-gray-400">
                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                    <br />
                    (รองรับ JPG, PNG ที่มี QR Code)
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg, image/png, image/jpg"
                    disabled={!selectedPkg}
                    onChange={e => handleFileChange(e.target.files?.[0])}
                  />
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-1 flex-col">
                  <div className="group relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-inner">
                    <img
                      src={preview}
                      alt="Slip Preview"
                      className="max-h-[360px] w-auto rounded-xl object-contain shadow-sm transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
                    <button
                      onClick={handleClearFile}
                      className="absolute right-4 top-4 rounded-full bg-white p-2.5 text-gray-600 shadow-md transition-all hover:bg-red-50 hover:text-red-600 active:scale-90"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!file || !selectedPkg || uploadSlipMutation.isPending}
                className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-lg font-bold text-white transition-all duration-200 ${
                  !file || !selectedPkg || uploadSlipMutation.isPending
                    ? 'cursor-not-allowed bg-gray-300 shadow-none'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-blue-600/40 active:translate-y-0'
                }`}
              >
                {uploadSlipMutation.isPending ? (
                  <>กำลังตรวจสอบสลิป...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-6 w-6" />
                    ยืนยันชำระเงิน {selectedPkg ? `฿${selectedPkg.price}` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AppLayout>
  )
}
