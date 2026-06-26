'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="flex flex-col items-center gap-5 max-w-sm">

        <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>

        <div>
          <p className="text-xl font-extrabold text-gray-900">Something went wrong</p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            We couldn&apos;t load this page. Try again or go back to your account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors"
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
      </div>
    </div>
  )
}
