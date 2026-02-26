'use client'

import Navbar from '@/components/Navbar'
import { Lightbulb, LayoutDashboard } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function Home() {
  const { data: session } = useSession()

  const role = session?.user?.role
  const dashboardUrl =
    role === 'TEACHER'
      ? '/dashboard/teacher/classroom'
      : '/dashboard/student/classroom'

  return (
    <div className="min-h-screen bg-[#FCFCFD] font-sans selection:bg-blue-200">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-4 pb-14 pt-24 md:pt-28">
        <div className="relative h-[350px] w-full max-w-4xl sm:h-[400px]">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            <line
              x1="15%"
              y1="50%"
              x2="85%"
              y2="50%"
              stroke="#E5E7EB"
              strokeWidth="1.5"
            />
            <line
              x1="30%"
              y1="50%"
              x2="20%"
              y2="20%"
              stroke="#E5E7EB"
              strokeWidth="1.5"
            />
            <line
              x1="30%"
              y1="50%"
              x2="25%"
              y2="80%"
              stroke="#E5E7EB"
              strokeWidth="1.5"
            />
            <line
              x1="70%"
              y1="50%"
              x2="75%"
              y2="20%"
              stroke="#E5E7EB"
              strokeWidth="1.5"
            />
            <line
              x1="70%"
              y1="50%"
              x2="75%"
              y2="80%"
              stroke="#E5E7EB"
              strokeWidth="1.5"
            />

            <circle cx="30%" cy="50%" r="3" fill="#2460E3" />
            <circle cx="70%" cy="50%" r="3" fill="#2460E3" />
            <circle cx="20%" cy="20%" r="2.5" fill="#2460E3" />
            <circle cx="25%" cy="80%" r="2.5" fill="#2460E3" />
            <circle cx="75%" cy="20%" r="2.5" fill="#2460E3" />
            <circle cx="75%" cy="80%" r="2.5" fill="#2460E3" />
          </svg>

          <div className="absolute left-[20%] top-[20%] flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white shadow-lg">
            <Image
              src="/discord.png"
              alt="Discord"
              fill
              className="object-cover"
            />
          </div>

          <div className="absolute left-[15%] top-[50%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border-[4px] border-white shadow-lg">
            <Image src="/boy.png" alt="User" fill className="object-cover" />
          </div>

          <div className="absolute left-[25%] top-[80%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white shadow-lg">
            <Image src="/bot.png" alt="Bot" fill className="object-cover" />
          </div>

          <div className="absolute left-[50%] top-[50%] flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2.5rem] bg-white shadow-[0_10px_40px_-10px_rgba(31,87,207,0.3)]">
            <div className="relative h-24 w-24">
              <Image
                src="/learnify-logo.png"
                alt="Learnify Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="absolute left-[75%] top-[20%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white shadow-lg">
            <Image
              src="/game-console.png"
              alt="Game Console"
              fill
              className="object-cover"
            />
          </div>

          <div className="absolute left-[85%] top-[50%] flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[24px] border border-gray-100 bg-[#FFE871] shadow-lg">
            <Lightbulb className="h-8 w-8 text-yellow-600" strokeWidth={1.5} />
          </div>

          <div className="absolute left-[75%] top-[80%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-[3px] border-white shadow-lg">
            <Image
              src="/lecture.png"
              alt="Classroom"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-black sm:text-5xl">
              ยินดีต้อนรับสู่ Learnify
            </h1>
            <h2 className="mt-2 text-3xl font-bold text-[#1F57CF] sm:text-5xl">
              เว็บไซต์ที่ทำให้การเรียนรู้ไม่เหมือนเดิม
            </h2>
          </div>

          <div className="flex max-w-2xl flex-col items-center justify-center text-gray-500">
            <p className="text-lg sm:text-xl">
              ค้นพบประสบการณ์การเรียนรูปแบบใหม่ ที่เทคโนโลยีช่วยให้บทเรียนสนุก
              เข้าใจง่าย และมีปฏิสัมพันธ์มากขึ้น ทั้งในและนอกห้องเรียน
            </p>
          </div>

          <div className="mt-5 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            {session?.user ? (
              <Link
                href={dashboardUrl}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1F57CF] px-8 py-4 text-lg font-semibold text-white shadow-[0_8px_20px_-6px_rgba(31,87,207,0.5)] transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-[0_12px_25px_-6px_rgba(31,87,207,0.6)] sm:w-auto"
              >
                ไปที่ Dashboard ของคุณ
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link href="/register" className="w-full sm:w-auto">
                  <button className="w-full rounded-full bg-[#1F57CF] px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-lg sm:w-48">
                    ติดต่อเรา
                  </button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <button className="w-full rounded-full border-2 border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 sm:w-48">
                    ลงชื่อเข้าใช้
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
