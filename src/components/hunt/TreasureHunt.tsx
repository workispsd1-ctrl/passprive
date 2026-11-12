'use client'

import { useEffect, useRef, useState } from 'react'
import { huntInfo, loadHunt, subscribeHuntToast, type HuntToast } from '@/lib/treasureHunt'

const TOAST_MS = 2600

function toastLabel(t: HuntToast) {
  if (!t.completed) return `${t.found} of ${t.total} found`
  return t.rewarded ? `All ${t.total} found · +${Number(t.reward_points)} credits` : `All ${t.total} found`
}

/**
 * Loads the Lemon hunt and shows its progress toast — app parity:
 * components/TreasureHunt.jsx (mounted once for the whole app).
 */
export function TreasureHunt() {
  const [toast, setToast] = useState<HuntToast | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    loadHunt()
    const onAuth = () => loadHunt()
    const onVisible = () => document.visibilityState === 'visible' && loadHunt()
    window.addEventListener('pp:auth', onAuth)
    document.addEventListener('visibilitychange', onVisible)
    const stop = subscribeHuntToast(next => {
      clearTimeout(timer.current)
      setToast(next)
      timer.current = setTimeout(() => setToast(null), next.completed ? TOAST_MS * 2 : TOAST_MS)
    })
    return () => {
      window.removeEventListener('pp:auth', onAuth)
      document.removeEventListener('visibilitychange', onVisible)
      stop()
      clearTimeout(timer.current)
    }
  }, [])

  if (!toast) return null
  return (
    <div role='status' aria-live='polite' className='fixed top-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-[#1C1B1F] px-4 py-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.3)] font-(family-name:--font-dm-sans)'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={huntInfo()?.icon_url || '/assets/refer/lemon.png'} alt='' className='size-5 object-contain' />
      <div>
        <p className='text-[13px] font-semibold text-white'>{toastLabel(toast)}</p>
        {toast.completed ? (
          <p className='mt-0.5 text-[12px] text-white/70'>{toast.rewarded ? 'Added to your Privé Credits' : 'Your credits will be added soon'}</p>
        ) : (
          <div className='mt-1.5 h-[3px] w-[72px] overflow-hidden rounded-sm bg-white/20'>
            <div className='h-full rounded-sm bg-[#F6D33C]' style={{ width: `${(72 * toast.found) / Math.max(toast.total, 1)}px` }} />
          </div>
        )}
      </div>
    </div>
  )
}
