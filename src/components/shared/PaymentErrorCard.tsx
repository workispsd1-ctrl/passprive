'use client'

import { XCircle, RefreshCw } from 'lucide-react'

interface Props {
  message: string
  onRetry?: () => void
  retryLabel?: string
  onSecondary: () => void
  secondaryLabel: string
}

export function PaymentErrorCard({ message, onRetry, retryLabel = 'Try again', onSecondary, secondaryLabel }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
      <XCircle className="w-16 h-16 text-red-400" />
      <p className="text-xl font-extrabold text-gray-900">Payment unsuccessful</p>
      <p className="text-sm text-gray-500">{message}</p>
      <div className="flex flex-col gap-2 w-full mt-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700"
          >
            <RefreshCw className="w-4 h-4" />
            {retryLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onSecondary}
          className="w-full py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
        >
          {secondaryLabel}
        </button>
      </div>
    </div>
  )
}
