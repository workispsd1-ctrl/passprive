'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { RestaurantHours } from '@/lib/types/dining'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmt(time: string | null): string {
  if (!time) return '—'
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export function HoursPopover({
  todayHours,
  allHours,
  statusText,
  isOpen,
}: {
  todayHours: RestaurantHours | null
  allHours: RestaurantHours[]
  statusText: string
  isOpen: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const today = new Date().getDay()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className='relative inline-flex items-center gap-1'>
      <button
        type='button'
        onClick={() => setOpen(v => !v)}
        className='inline-flex items-center gap-0.5 text-gray-500 hover:text-gray-700 transition-colors'
      >
        <span className='text-[14px]'>{statusText}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className='absolute top-full left-0 mt-2 z-50 w-56 bg-white border border-gray-200 rounded-2xl shadow-lg p-3'>
          {allHours.length === 0 ? (
            <p className='text-[13px] text-gray-400 text-center py-2'>No hours available</p>
          ) : (
            <ul className='space-y-1'>
              {DAYS.map((day, i) => {
                const row = allHours.find(h => h.day_of_week === i)
                const isToday = i === today
                return (
                  <li
                    key={day}
                    className={`flex justify-between items-center px-2 py-1 rounded-lg text-[13px] ${isToday ? 'bg-gray-50 font-semibold' : ''}`}
                  >
                    <span className={isToday ? 'text-gray-900' : 'text-gray-500'}>{day}</span>
                    {!row || row.is_closed ? (
                      <span className='text-orange-500 font-medium'>Closed</span>
                    ) : (
                      <span className='text-gray-700'>{fmt(row.open_time)} – {fmt(row.close_time)}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
