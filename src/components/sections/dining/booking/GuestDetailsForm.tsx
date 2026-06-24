'use client'

import { Loader2 } from 'lucide-react'
import type { DateOption, SlotOption } from './types'

interface Props {
  name: string
  phone: string
  request: string
  date: string
  selectedTime: string | null
  guests: number
  dateOptions: DateOption[]
  allSlots: SlotOption[]
  loading: boolean
  error: string | null
  onBack: () => void
  onNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onRequestChange: (v: string) => void
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void
}

export function GuestDetailsForm({ name, phone, request, date, selectedTime, guests, dateOptions, allSlots, loading, error, onBack, onNameChange, onPhoneChange, onRequestChange, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <button
            type="button"
            aria-label="Go back"
            onClick={onBack}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 mb-1"
          >
            ← Back
          </button>
          <p className="text-base font-extrabold text-gray-900">Your details</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {dateOptions.find(d => d.value === date)?.label} ·{' '}
            {allSlots.find(s => s.value === selectedTime)?.label} ·{' '}
            {guests} {guests === 1 ? 'guest' : 'guests'}
          </p>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Your name</label>
              <input
                type="text"
                value={name}
                onChange={e => onNameChange(e.target.value)}
                placeholder="Full name"
                required
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-violet-400"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => onPhoneChange(e.target.value)}
                placeholder="+230 5XXX XXXX"
                required
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-violet-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Special request <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={request}
              onChange={e => onRequestChange(e.target.value)}
              placeholder="Allergies, celebrations, seating preference…"
              rows={2}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:border-violet-400"
            />
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-sm transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Booking…' : 'Confirm booking'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
