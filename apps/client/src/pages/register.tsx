import { useMutation } from '@tanstack/react-query'
// import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
// import { signIn } from 'next-auth/react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { IoChevronBackSharp, IoMail } from 'react-icons/io5'
import { toast } from 'sonner'

import {
  RegisterArgs as BaseRegisterArgs,
  register as registerFn,
} from '@/services/user'
import { Waves } from 'lucide-react'
import { FaLock } from 'react-icons/fa6'

type RegisterArgs = BaseRegisterArgs & { confirmPassword: string }

const Register = () => {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<RegisterArgs>({
    mode: 'onChange',
  })

  const registerMutation = useMutation({
    mutationFn: (args: RegisterArgs) => registerFn(args),
  })

  const onSubmit: SubmitHandler<RegisterArgs> = async args => {
    try {
      console.log('args', args)
      if (args.password !== args.confirmPassword) {
        throw new Error('รหัสผ่านไม่ตรงกัน')
      }
      if (args.firstName.length < 2 && args.lastName.length < 2) {
        throw new Error('กรุณาระบุชื่อและนามสกุลของคุณให้ถูกต้อง')
      }
      if (args.password.length < 8) {
        throw new Error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      }
      if (!args.email.includes('@')) {
        throw new Error('กรุณาระบุอีเมลที่ถูกต้อง')
      }

      await registerMutation.mutateAsync(args)

      router.push('/login')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden bg-white">
      <div className="absolute inset-0 z-0 m-10">
        <Link
          href="/"
          className="flex flex-row items-center gap-1 text-center text-sm text-gray-600 hover:text-black"
        >
          {/* <span className="text-black text-2xl">FloodSim</span> */}
          <IoChevronBackSharp className="h-auto w-4" />
          <span className="text-base">กลับ</span>
        </Link>
      </div>
      <div className="relative z-10 flex h-[650px] w-full max-w-[700px] flex-col justify-between rounded-lg bg-white p-8 sm:mt-5 md:mt-10">
        <div className="mt-14 flex flex-col justify-center px-10">
          <div className="flex flex-col items-center justify-center gap-5">
            <Waves className="h-auto w-14 text-[#6b92df]" />
            <h1 className="text-center text-2xl font-bold text-black">
              ยินดีต้อนรับเข้าสู่ระบบ
            </h1>
          </div>

          <h1 className="mt-2 text-center text-lg font-bold text-black/70">
            โปรดกรอก ข้อมูลของท่าน ในการเริ่มต้นใช้งาน
          </h1>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 flex flex-col gap-3"
          >
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex w-full flex-col justify-center gap-1">
                <p className="text-sm">ชื่อ</p>
                <label className="input input-bordered flex w-full items-center gap-2">
                  <input
                    type="text"
                    className="grow"
                    placeholder="กรุณากรอกชื่อ"
                    {...register('firstName', { required: true })}
                  />
                </label>
              </div>
              <div className="flex w-full flex-col justify-center gap-1">
                <p className="text-sm">นามสกุล</p>
                <label className="input input-bordered flex w-full items-center gap-2">
                  <input
                    type="text"
                    className="grow"
                    placeholder="กรุณากรอกนามสกุล"
                    {...register('lastName', { required: true })}
                  />
                </label>
              </div>
            </div>
            <div className="flex w-full flex-col justify-center gap-1">
              <p className="text-sm">อีเมล</p>
              <label className="input input-bordered flex items-center gap-2">
                <IoMail />
                <input
                  type="email"
                  className="grow"
                  placeholder="กรุณากรอกอีเมล"
                  {...register('email', { required: true })}
                />
              </label>
            </div>
            <div className="flex w-full flex-col justify-center gap-1">
              <p className="text-sm">รหัสผ่าน</p>
              <label className="input input-bordered flex items-center gap-2">
                <FaLock />
                <input
                  type="password"
                  className="grow"
                  placeholder="กรุณากรอกรหัสผ่าน"
                  {...register('password', { required: true })}
                />
              </label>
            </div>
            <div className="flex w-full flex-col justify-center gap-1">
              <p className="text-sm">ยืนยันรหัสผ่าน</p>
              <label className="input input-bordered flex items-center gap-2">
                <FaLock />
                <input
                  type="password"
                  className="grow"
                  placeholder="กรุณายืนยันรหัสผ่าน"
                  {...register('confirmPassword', { required: true })}
                />
              </label>
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={`mt-6 w-7/12 rounded-full border px-4 py-2 font-semibold text-white transition-[background-position] duration-700 ease-in-out ${
                  !isValid || isSubmitting
                    ? 'cursor-not-allowed border-white/20 bg-gray-400'
                    : 'border-white/20 bg-[linear-gradient(to_right,_#8CCDEB_50%,_#60a5fa_50%)] bg-[length:200%_100%] bg-left hover:bg-right'
                }`}
              >
                สมัครสมาชิก
              </button>
            </div>
          </form>
        </div>
        <div className="mt-10 flex items-center justify-center gap-3 px-10">
          <p>ท่านมีบัญชีอยู่แล้ว ?</p>
          <Link href="/login" className="text-center text-sm text-black">
            <span className="text-blue-400 hover:underline">เข้าสู่ระบบ!</span>
          </Link>
        </div>
      </div>
    </div>

    // <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
    //   <div className="absolute inset-0 z-0">
    //     <Wave />
    //   </div>
    //   <div className="relative z-10 flex w-full max-w-[450px] flex-col gap-4 rounded-lg bg-gradient-to-b from-[#150f38]/60 to-[#1c1d54]/80 p-8 shadow-md">
    //     <h1 className="text-center text-2xl font-bold text-white">
    //       สมัครบัญชีของท่าน
    //     </h1>
    //     <form
    //       onSubmit={handleSubmit(onSubmit)}
    //       className="flex w-full flex-col gap-4"
    //     >
    //       <div className="flex flex-row gap-4">
    //         <input
    //           type="text"
    //           className="input input-bordered w-full"
    //           placeholder="ชื่อ"
    //           {...register('firstName', { required: true })}
    //         />
    //         <input
    //           type="text"
    //           className="input input-bordered w-full"
    //           placeholder="นามสกุล"
    //           {...register('lastName', { required: true })}
    //         />
    //       </div>
    //       <label className="input input-bordered flex items-center gap-2">
    //         <IoMail />
    //         <input
    //           type="email"
    //           className="grow"
    //           placeholder="อีเมล"
    //           {...register('email', { required: true })}
    //         />
    //       </label>
    //       <input
    //         type="password"
    //         className="input input-bordered grow"
    //         placeholder="รหัสผ่าน"
    //         {...register('password', { required: true })}
    //       />
    //       <input
    //         type="password"
    //         className="input input-bordered grow"
    //         placeholder="ยืนยันรหัสผ่าน"
    //         {...register('confirmPassword', { required: true })}
    //       />
    //       <button
    //         type="submit"
    //         disabled={isSubmitting}
    //         className="btn disabled:btn-disabled border border-white/20 bg-[#1c1d54] text-white hover:border-white/60 hover:bg-[#1c1d54]/70"
    //       >
    //         สมัคร
    //       </button>
    //     </form>
    //     <hr className="mt-5" />
    //     <Link href="/login" className="mt-4 text-center text-sm text-white">
    //       มีบัญชีแล้วใช่มั้ย?{' '}
    //       <span className="text-blue-400 hover:underline">ลงชื่อเข้าใช้!</span>
    //     </Link>
    //   </div>
    // </div>
  )
}

export default Register
