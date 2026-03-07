export default function Rotation() {
  return (
    <>
      <style>{`
        @keyframes rotate-device {
          0% { transform: rotate(0deg); }
          40% { transform: rotate(-90deg); }
          100% { transform: rotate(-90deg); }
        }
        .animate-rotate-device {
          animation: rotate-device 2s ease-in-out infinite alternate;
        }
      `}</style>

      <div className="fixed inset-0 z-[9999] hidden flex-col items-center justify-center bg-black/60 text-center text-white backdrop-blur-sm portrait:flex">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 p-4 shadow-lg ring-1 ring-white/20">
          <svg
            className="animate-rotate-device h-16 w-16 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <path d="M12 18h.01" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold drop-shadow-md">
          กรุณาหมุนโทรศัพท์เป็นแนวนอน
        </h1>
        <p className="mt-2 text-gray-200 drop-shadow-md">
          เพื่อประสบการณ์การเล่นที่ดีที่สุด
        </p>
      </div>
    </>
  )
}
