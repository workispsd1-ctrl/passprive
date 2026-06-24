'use client'

import type { ChangeEvent } from 'react'

interface Props {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  label?: string
  error?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const SIZE = {
  sm: { input: 'text-sm font-bold', prefix: 'text-sm font-semibold', border: 'border', padding: 'px-3 py-2' },
  md: { input: 'text-2xl font-extrabold', prefix: 'text-base font-bold', border: 'border-2', padding: 'px-4 py-3' },
  lg: { input: 'text-5xl font-black', prefix: 'text-2xl font-bold', border: 'border-2', padding: 'px-4 py-4' },
}

export function CurrencyInput({ value, onChange, label, error, size = 'md' }: Props) {
  const s = SIZE[size]
  return (
    <div>
      {label && (
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{label}</p>
      )}
      <div className={`flex items-center gap-2 ${s.border} border-gray-200 rounded-xl ${s.padding} focus-within:border-violet-500 transition-colors`}>
        <span className={`${s.prefix} text-gray-400 shrink-0`}>₨</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={onChange}
          className={`flex-1 ${s.input} text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-300`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
    </div>
  )
}
