'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="flex flex-col items-center gap-5 max-w-sm">

        <div className="w-16 h-16 rounded-3xl bg-violet-50 border border-violet-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-violet-500" />
        </div>

        <div>
          <p className="text-xl font-extrabold text-gray-900">Something went wrong</p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            We hit an unexpected error. Try refreshing — if it keeps happening, our team has been notified.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Go home
          </Link>
        </div>

        <Link href="/" className="mt-2 opacity-50 hover:opacity-80 transition-opacity">
          <Image src="/passpriveLogo.png" alt="PassPrivé" width={100} height={34} className="h-8 w-auto object-contain" />
        </Link>
      </div>
    </div>
  )
}
