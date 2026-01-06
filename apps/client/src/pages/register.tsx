import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { SubmitHandler, useForm } from 'react-hook-form'
import { IoChevronBackSharp, IoMail } from 'react-icons/io5'
import { FaLock } from 'react-icons/fa6'
import { toast } from 'sonner'
import { useState } from 'react'

import {
  RegisterArgs as BaseRegisterArgs,
  register as registerFn,
} from '@/services/user'

type RegisterForm = BaseRegisterArgs & {
  confirmPassword: string
}

const Register = () => {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { isSubmitting, isValid },
  } = useForm<RegisterForm>({
    mode: 'onChange',
  })

  const registerMutation = useMutation({
    mutationFn: (args: BaseRegisterArgs) => registerFn(args),
  })

  const handleNextStep = () => {
    const schoolName = getValues('schoolName')

    if (!schoolName || schoolName.length < 2) {
      toast.error('กรุณากรอกชื่อโรงเรียนให้ถูกต้อง')
      return
    }

    setStep(2)
  }

  const onSubmit: SubmitHandler<RegisterForm> = async args => {
    try {
      if (args.password !== args.confirmPassword) {
        throw new Error('รหัสผ่านไม่ตรงกัน')
      }
      if (args.password.length < 8) {
        throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      }

      await registerMutation.mutateAsync({
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        password: args.password,
        phoneNumber: args.phoneNumber,
        schoolName: args.schoolName,
      })

      toast.success('สมัครสมาชิกสำเร็จ')
      router.push('/login')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="absolute left-6 top-6">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-black"
        >
          <IoChevronBackSharp className="w-4" />
          กลับ
        </Link>
      </div>
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white p-8 px-4 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {step === 1 && (
            <>
              <h1 className="text-center text-2xl font-bold">
                ข้อมูลโรงเรียน/มหาวิทยาลัย
              </h1>

              <div className="flex flex-col gap-1">
                <p className="text-sm">ชื่อโรงเรียน/มหาวิทยาลัย</p>
                <input
                  className="input input-bordered"
                  placeholder="กรุณากรอกชื่อโรงเรียน/มหาวิทยาลัย"
                  {...register('schoolName', { required: true })}
                />
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="mt-4 rounded-full bg-blue-500 py-2 font-semibold text-white hover:bg-blue-600"
              >
                ถัดไป
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-500"
              >
                <IoChevronBackSharp />
                ย้อนกลับ
              </button>

              <h1 className="text-center text-2xl font-bold">
                ข้อมูลผู้ใช้งาน
              </h1>

              <div className="flex gap-4">
                <input
                  className="input input-bordered w-full"
                  placeholder="ชื่อ"
                  {...register('firstName', { required: true })}
                />
                <input
                  className="input input-bordered w-full"
                  placeholder="นามสกุล"
                  {...register('lastName', { required: true })}
                />
              </div>

              <label className="input input-bordered flex items-center gap-2">
                <IoMail />
                <input
                  type="email"
                  className="grow"
                  placeholder="อีเมล"
                  {...register('email', { required: true })}
                />
              </label>

              <label className="input input-bordered flex items-center gap-2">
                <FaLock />
                <input
                  type="password"
                  className="grow"
                  placeholder="รหัสผ่าน"
                  {...register('password', { required: true })}
                />
              </label>

              <label className="input input-bordered flex items-center gap-2">
                <FaLock />
                <input
                  type="password"
                  className="grow"
                  placeholder="ยืนยันรหัสผ่าน"
                  {...register('confirmPassword', { required: true })}
                />
              </label>

              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="mt-4 rounded-full bg-blue-500 py-2 font-semibold text-white disabled:bg-gray-400"
              >
                สมัครสมาชิก
              </button>

              <p className="mt-3 text-center text-sm">
                มีบัญชีแล้ว?{' '}
                <Link href="/login" className="text-blue-500 hover:underline">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default Register

//TODO : aong can u design this page and make it look better?
