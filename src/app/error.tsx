'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0e0120] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-violet-700/25 blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full bg-fuchsia-600/15 blur-[100px]" />
        </div>

        <div className="relative flex flex-col items-center gap-6 max-w-sm">
          <Link href="/">
            <Image
              src="/passpriveLogo.png"
              alt="PassPrivé"
              width={140}
              height={48}
              className="h-12 w-auto object-contain brightness-0 invert opacity-80"
            />
          </Link>

          <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-violet-300" />
          </div>

          <div>
            <p className="text-xl font-extrabold text-white">Something went wrong</p>
            <p className="text-sm text-violet-300/70 mt-2 leading-relaxed">
              An unexpected error occurred. Please try again or return home.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              type="button"
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-[#2d0a5e] font-bold text-sm hover:bg-violet-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Try again
            </button>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center py-3 rounded-2xl border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-colors"
            >
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
