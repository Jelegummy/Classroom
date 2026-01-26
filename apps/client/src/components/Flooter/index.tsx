import Link from 'next/link'
import { Waves } from 'lucide-react'
import React from 'react'

const Flooter = () => {
  return (
    <div className="hidden w-full md:block">
      <footer className="flex w-full shrink-0 flex-col items-center gap-2 border-t bg-gray-50 px-4 py-6 sm:flex-row md:px-6">
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium">Leanify</span>
        </div>
        <p className="text-xs text-gray-500 sm:ml-4">
          © 2024 Leanify. All rights reserved.
        </p>
        <nav className="flex gap-4 sm:ml-auto sm:gap-6">
          <Link
            href="#"
            className="text-xs text-gray-500 underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="#"
            className="text-xs text-gray-500 underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-xs text-gray-500 underline-offset-4 hover:underline"
          >
            Support
          </Link>
        </nav>
      </footer>
    </div>
  )
}

export default Flooter
