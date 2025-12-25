import Navbar from '@/components/Navbar'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="mt-20 flex flex-col items-center justify-center gap-14 px-4 md:mt-32">
        <div className="flex w-full flex-col items-center justify-center gap-6">
          <div className="flex flex-row items-center justify-center">
            <Image
              src="/learnify-logo.png"
              alt="Learnify Logo"
              width={50}
              height={50}
            />
            <h1 className="text-xl font-bold text-black">Learnify</h1>
          </div>

          <div className="text-5xl font-bold">ยินดีต้อนรับสู่ Learnify</div>
          <div className="text-5xl font-bold text-[#1F57CF]">
            เว็บไซต์ที่ทำให้ การเรียนรู้ไม่เหมือนเดิม
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-xl">
              ค้นพบประสบการณ์การเรียนรูปแบบใหม่ ที่เทคโนโลยีช่วยให้บทเรียนสนุก
              เข้าใจง่าย
            </p>
            <p className="text-xl">
              และมีปฏิสัมพันธ์มากขึ้น ทั้งในและนอกห้องเรียน
            </p>
          </div>
        </div>
        <div className="flex w-full flex-row items-center justify-center gap-2">
          <button className="btn btn-md w-48 rounded-full bg-[#2460E3] text-white">
            เริ่มต้นใช้งาน
          </button>

          <button className="btn btn-md w-48 rounded-full bg-white text-[#2460E3]">
            ลงชื่อเข้าใช้
          </button>
        </div>
      </div>
    </>
  )
}
