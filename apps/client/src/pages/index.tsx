import Link from 'next/link'

export default function Home() {
  return (
    <>
      <div className="flex h-screen items-center justify-center">
        <Link href="/login">Login ไอ้ตูดหมึก</Link>
        <Link href="/register" className="ml-4">
          Register ไอ้ตูดหมึก
        </Link>
      </div>
    </>
  )
}
