'use client'

import { Loader2 } from 'lucide-react'

interface Props {
  message?: string
}

export function PaymentLoadingScreen({ message = 'Verifying your payment…' }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
      <p className="text-base font-semibold text-gray-700">{message}</p>
      <p className="text-sm text-gray-400">Please do not close or refresh this page.</p>
    </div>
  )
}
