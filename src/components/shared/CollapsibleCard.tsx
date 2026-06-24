'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  title: string
  icon?: React.ReactNode
  badge?: string
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function CollapsibleCard({ title, icon, badge, defaultOpen = false, children, className = '' }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge && (
            <span className="text-xs bg-violet-100 text-violet-600 font-medium px-2 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}
