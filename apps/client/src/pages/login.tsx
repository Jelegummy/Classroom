import Link from 'next/link'
import { useRouter } from 'next/router'
import { getSession, signIn } from 'next-auth/react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { FaLock, FaUser } from 'react-icons/fa6'
import { toast } from 'sonner'
import { LoginArgs } from '@/services/user'
import { IoChevronBackSharp } from 'react-icons/io5'
import Image from 'next/image'

const Login = () => {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm<LoginArgs>({
    mode: 'onChange',
  })

  const onSubmit: SubmitHandler<LoginArgs> = async data => {
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (!res?.ok) {
        throw new Error(
          res?.error ?? 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ โปรดลองอีกครั้ง',
        )
      }
      const session = await getSession()

      localStorage.setItem('accessToken', session?.user.accessToken ?? '')
      const userRole = session?.user?.role

      if (userRole === 'TEACHER') {
        router.push('/dashboard/teacher/classroom')
      } else if (userRole === 'ADMIN') {
        router.push('/dashboard/admin')
      } else {
        router.push('/dashboard/student/classroom')
      }
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
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
        <div className="flex flex-col justify-center px-8 py-12 md:px-12">
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/learnify-logo.png"
              alt="Learnify Logo"
              width={56}
              height={56}
            />
            <h1 className="text-2xl font-bold text-black">
              ยินดีต้อนรับเข้าสู่ระบบ
            </h1>
            <p className="text-center text-sm text-gray-500">
              กรุณากรอกอีเมลและรหัสผ่านเพื่อเริ่มต้นใช้งาน
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-10 flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-black">อีเมล</label>
              <label className="input input-bordered flex items-center gap-2 rounded-xl">
                <FaUser className="text-gray-400" />
                <input
                  type="email"
                  className="grow"
                  placeholder="example@email.com"
                  {...register('email', { required: true })}
                />
              </label>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-black">รหัสผ่าน</label>
              <label className="input input-bordered flex items-center gap-2 rounded-xl">
                <FaLock className="text-gray-400" />
                <input
                  type="password"
                  className="grow"
                  placeholder="••••••••"
                  {...register('password', { required: true })}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`mt-6 rounded-full py-3 text-sm font-semibold text-white transition ${
                !isValid || isSubmitting
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-primary hover:opacity-90'
              }`}
            >
              เข้าสู่ระบบ
            </button>
          </form>
          <div className="mt-6 flex justify-center gap-2 text-sm">
            <span className="text-gray-600">ยังไม่มีบัญชี?</span>
            <Link
              href="/register"
              className="font-semibold text-[#1F57CF] hover:underline"
            >
              สมัครเลย
            </Link>
          </div>
        </div>
        <div className="relative hidden items-center justify-center md:flex">
          <Image
            src="/loginImage.jpg"
            alt="Login Illustration"
            width={800}
            height={800}
            className="rounded-3xl object-cover"
          />
        </div>
      </div>
    </div>
  )
}

export default Login
