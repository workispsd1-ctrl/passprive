'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export { FAV_UNIT, FAV_PAGE } from './unit'

/** Figma "Back": 44 circle #FAFAFA, chevron #595B61 / 1.4. */
export function BackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter()
  return (
    <button
      type='button'
      aria-label='Back'
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className='flex size-44 shrink-0 items-center justify-center rounded-full bg-[#FAFAFA] text-[#595B61] transition-colors hover:bg-[#F0F0F0] max-lg:size-36'
    >
      <ChevronLeft className='size-28 max-lg:size-22' strokeWidth={1.4} />
    </button>
  )
}

/** Figma "Page header": 112 tall, 0/172 padding, 1px #EBEBEB under; back + 32/40 title (gap 20), actions gap 12. */
export function PageHeader({ title, back, actions }: { title: string; back?: string; actions?: React.ReactNode }) {
  return (
    <header className='flex h-112 items-center justify-between gap-12 border-b border-[#EBEBEB] px-172 max-lg:h-64 max-lg:px-16'>
      <div className='flex min-w-0 items-center gap-20 max-lg:gap-12'>
        <BackButton fallback={back} />
        <h1 className='truncate text-[calc(32*var(--u))] leading-40 font-bold text-[#2C2D32] max-lg:text-[20px] max-lg:leading-28'>{title}</h1>
      </div>
      {actions && <div className='flex shrink-0 items-center gap-12 max-lg:gap-8'>{actions}</div>}
    </header>
  )
}

/** Figma "Share" / "List controls": 44 circle #FAFAFA. */
export function IconCircle({
  label,
  onClick,
  active,
  children,
}: {
  label: string
  onClick?: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type='button'
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex size-44 items-center justify-center rounded-full bg-[#FAFAFA] text-[#595B61] transition-colors hover:bg-[#F0F0F0] max-lg:size-36',
        active && 'bg-brand-tint text-brand hover:bg-brand-tint',
      )}
    >
      {children}
    </button>
  )
}

/** Figma "Action": 48 tall, padding 12/16, radius 28, 700 16/24 +0.15px. */
export function PrimaryPill({
  children,
  onClick,
  href,
  variant = 'solid',
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  /** solid #FF4800 / soft rgba(255,72,0,.07) with orange text ("+ New List") */
  variant?: 'solid' | 'soft'
  className?: string
}) {
  const cls = cn(
    'inline-flex h-48 items-center justify-center gap-6 rounded-[calc(28*var(--u))] px-16 py-12 text-[calc(16*var(--u))] leading-24 font-bold tracking-[calc(0.15*var(--u))] transition-colors',
    'max-lg:h-40 max-lg:rounded-full max-lg:px-16 max-lg:text-[14px] max-lg:leading-20',
    variant === 'solid' ? 'bg-[#FF4800] text-white hover:bg-brand-dark' : 'bg-[rgba(255,72,0,0.0706)] text-[#FF4800] hover:bg-[rgba(255,72,0,0.12)]',
    className,
  )
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button type='button' onClick={onClick} className={cls}>
      {children}
    </button>
  )
}

type Toast = { key: number; message: string; canUndo: boolean }
type Pending = { commit: () => void; undo: () => void; timer: number }

const UNDO_MS = 5000

/**
 * Deferred destructive actions with an Undo toast: the UI updates at once,
 * the server call runs when the toast times out — or straight away if another
 * action replaces it, the page unmounts, or the tab is closed (commits use
 * `keepalive` fetches, so they survive navigation).
 */
export function useUndoable() {
  const [toast, setToast] = useState<Toast | null>(null)
  const pending = useRef<Pending | null>(null)
  const infoTimer = useRef<number | null>(null)

  const flush = useCallback(() => {
    const p = pending.current
    if (!p) return
    window.clearTimeout(p.timer)
    pending.current = null
    p.commit()
  }, [])

  const run = useCallback(
    (message: string, commit: () => void, undo: () => void) => {
      flush()
      if (infoTimer.current) window.clearTimeout(infoTimer.current)
      const timer = window.setTimeout(() => {
        pending.current = null
        setToast(null)
        commit()
      }, UNDO_MS)
      pending.current = { commit, undo, timer }
      setToast({ key: Date.now(), message, canUndo: true })
    },
    [flush],
  )

  /** A plain message (no Undo). */
  const notify = useCallback(
    (message: string) => {
      flush()
      if (infoTimer.current) window.clearTimeout(infoTimer.current)
      setToast({ key: Date.now(), message, canUndo: false })
      infoTimer.current = window.setTimeout(() => setToast(null), 2500)
    },
    [flush],
  )

  const undo = useCallback(() => {
    const p = pending.current
    if (!p) return
    window.clearTimeout(p.timer)
    pending.current = null
    setToast(null)
    p.undo()
  }, [])

  useEffect(() => {
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
      if (infoTimer.current) window.clearTimeout(infoTimer.current)
    }
  }, [flush])

  // Figma "Deletion feedback": 420 × 56, bottom 64, #2C2D32, radius 28, padding 0/24
  const node = toast ? (
    <div
      key={toast.key}
      role='status'
      aria-live='polite'
      className='fixed bottom-64 left-1/2 z-60 flex h-56 w-420 max-w-[calc(100vw-32px)] -translate-x-1/2 items-center justify-between gap-16 rounded-[calc(28*var(--u))] bg-[#2C2D32] px-24 shadow-[0_calc(4*var(--u))_calc(16*var(--u))_rgba(0,0,0,0.149)] animate-in fade-in-0 slide-in-from-bottom-3 max-lg:bottom-152'
    >
      <span className='truncate text-[calc(14*var(--u))] leading-20 font-medium text-white'>{toast.message}</span>
      {toast.canUndo && (
        <button type='button' onClick={undo} className='shrink-0 text-[calc(14*var(--u))] leading-20 font-semibold text-[#FF4800] hover:text-brand-light'>
          Undo
        </button>
      )}
    </div>
  ) : null

  return { run, notify, toast: node }
}

/** Figma "Heart illustration" — 300 × 232 (asset exported at 2×, flattened onto the page's white). */
export function EmptyHeartArt({ className }: { className?: string }) {
  return (
    <Image
      src='/assets/favourites/empty-heart.jpg'
      alt=''
      aria-hidden
      width={600}
      height={464}
      priority
      className={cn('h-232 w-300 max-lg:h-174 max-lg:w-225', className)}
    />
  )
}

/** Close a popover on outside click or Escape. */
export function useDismiss(ref: React.RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, open, close])
}
