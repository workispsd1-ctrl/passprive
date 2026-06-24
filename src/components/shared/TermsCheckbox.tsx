'use client'

import { Check } from 'lucide-react'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  children: React.ReactNode
  accent?: 'violet' | 'black'
}

export function TermsCheckbox({ checked, onChange, children, accent = 'violet' }: Props) {
  const activeColor = accent === 'black' ? 'bg-gray-900 border-gray-900' : 'bg-violet-600 border-violet-600'
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? activeColor : 'border-gray-300 bg-white'}`}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="text-sm text-gray-600 leading-snug">{children}</span>
    </label>
  )
}
