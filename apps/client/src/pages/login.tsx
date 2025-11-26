import Link from 'next/link'
import { useRouter } from 'next/router'
import { getSession, signIn } from 'next-auth/react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { FaLock, FaUser } from 'react-icons/fa6'
import { toast } from 'sonner'
import { LoginArgs } from '@/services/user'
import { IoChevronBackSharp } from 'react-icons/io5'
import { Waves } from 'lucide-react'
// import Wave from '@/components/Wave'

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

      router.push('/dashboard/account')
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
      <div className="relative z-10 mt-20 flex h-[650px] w-full max-w-[700px] flex-col justify-between rounded-lg bg-white p-8">
        <div className="mt-14 flex flex-col justify-center px-10">
          <div className="flex flex-col items-center justify-center gap-5">
            <Waves className="h-auto w-14 text-[#6b92df]" />
            <h1 className="text-center text-2xl font-bold text-black">
              ยินดีต้อนรับเข้าสู่ระบบ
            </h1>
          </div>

          <h1 className="mt-2 text-center text-lg font-bold text-black/70">
            โปรดกรอก อีเมล และ รหัสผ่าน ในการเริ่มต้นใช้งาน
          </h1>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-10 flex flex-col gap-3"
          >
            <p className="text-sm text-black">อีเมล</p>
            <label className="input input-bordered flex items-center gap-2 rounded-xl">
              <FaUser />
              <input
                type="email"
                className="grow"
                placeholder="กรุณากรอกอีเมล"
                {...register('email', { required: true })}
              />
            </label>

            <p className="text-sm text-black">รหัสผ่าน</p>
            <label className="input input-bordered flex items-center gap-2 rounded-xl">
              <FaLock />
              <input
                type="password"
                className="grow"
                placeholder="กรุณากรอกรหัสผ่าน"
                {...register('password', { required: true })}
              />
            </label>
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
                เข้าสู่ระบบ
              </button>
            </div>
          </form>
        </div>
        <div className="flex items-center justify-center gap-3 px-10">
          <p>ยังไม่มีบัญชีใช่มั้ย ?</p>
          <Link href="/register" className="text-center text-sm text-black">
            <span className="text-blue-400 hover:underline">สมัครเลย!</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
