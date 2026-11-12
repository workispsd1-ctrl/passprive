'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronUp, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const SAMPLE_IMAGE = 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=600&auto=format&fit=crop'
const SAMPLE_MESSAGE = "Many happy returns of the day. You've been working so hard, and it's time for some well-deserved pampering! Here is your gift"

type Phase = 'envelope' | 'revealed' | 'claim'

/**
 * What the person receiving the gift sees — app parity:
 * screens/ReceiverPreviewScreen.jsx (envelope → drag the card up → the gift
 * card) and screens/GiftAnimationScreen.jsx ("You received a gift" →
 * Congratulations → unlocked). The app's unlocked card always says 5,000
 * coins; here it shows the gift's own value. Mount it only while open, so
 * each opening starts from the envelope.
 */
export function GiftReceiverPreview({
  open,
  onClose,
  recipientName,
  senderName,
  giftTitle,
  giftMessage,
  imageUrl,
  amount,
}: {
  open: boolean
  onClose: () => void
  recipientName?: string
  senderName?: string
  giftTitle?: string
  giftMessage?: string
  imageUrl?: string | null
  amount: number
}) {
  const [phase, setPhase] = useState<Phase>('envelope')
  const [drag, setDrag] = useState(0)
  const [scene, setScene] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef<number | null>(null)

  const recipient = recipientName?.trim() || 'Raghav'
  const sender = senderName?.trim() || 'Mansi'
  const title = giftTitle?.trim() || 'Happy Birthday!'
  const message = giftMessage?.trim() || SAMPLE_MESSAGE
  const image = imageUrl || SAMPLE_IMAGE

  // GiftAnimationScreen: the box shakes, "Congratulations" writes in, then the unlocked card
  useEffect(() => {
    if (phase !== 'claim') return
    const a = setTimeout(() => setScene(1), 1600)
    const b = setTimeout(() => setScene(2), 3400)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [phase])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const reveal = () => { setDrag(0); setPhase('revealed') }
  const onPointerDown = (e: React.PointerEvent) => { startY.current = e.clientY; setDragging(true); (e.target as Element).setPointerCapture?.(e.pointerId) }
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null) return
    setDrag(Math.max(0, Math.min(220, startY.current - e.clientY)))
  }
  const onPointerUp = () => {
    if (startY.current == null) return
    startY.current = null
    setDragging(false)
    if (drag > 90) reveal()
    else setDrag(0)
  }

  return (
    <div role='dialog' aria-modal='true' aria-label="Receiver's preview" className='fixed inset-0 z-[90] flex flex-col bg-[linear-gradient(180deg,#2A1B3D,#120B1C)] font-(family-name:--font-dm-sans) text-white'>
      <div className='flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3'>
        <button type='button' onClick={phase === 'claim' ? () => setPhase('revealed') : onClose} aria-label='Back' className='rounded-full p-1.5 hover:bg-white/10'>
          <ArrowLeft className='size-6' />
        </button>
        <p className='text-[13px] font-bold tracking-[0.2em]'>{phase === 'claim' ? 'CLAIM GIFT' : "RECEIVER'S PREVIEW"}</p>
        <button type='button' onClick={onClose} aria-label='Close' className='rounded-full p-1.5 hover:bg-white/10'>
          <X className='size-6' />
        </button>
      </div>

      {phase === 'envelope' && (
        <div className='relative flex flex-1 flex-col items-center overflow-hidden'>
          <div className='mt-[18vh] text-center'>
            <p className='text-[28px] font-bold'>{recipient} <span className='inline-block animate-bounce'>👋</span></p>
            <p className='mt-1 text-[20px] text-white/80'>{sender} sent you <span className='font-bold text-[#FFB27A]'>a gift</span></p>
          </div>
          <div className='absolute inset-x-0 bottom-0 flex flex-col items-center'>
            <button type='button' onClick={reveal} className='mb-3 flex flex-col items-center text-[11px] font-bold tracking-[0.2em] text-white/80'>
              <ChevronUp className='size-4 animate-pulse' strokeWidth={2.5} />
              DRAG UP TO REVEAL
            </button>
            <div className='relative h-64 w-full max-w-md'>
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className='absolute top-0 left-1/2 h-56 w-[72%] cursor-grab touch-none overflow-hidden rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.4)] active:cursor-grabbing'
                style={{ transform: `translate(-50%, ${-drag}px) rotate(${-drag / 40}deg)`, transition: dragging ? 'none' : 'transform 250ms ease-out' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt='' className='size-full object-cover' draggable={false} />
              </div>
              <div className='pointer-events-none absolute inset-x-0 bottom-0 h-36 rounded-t-3xl border-t-[1.5px] border-dashed border-white/20 bg-[linear-gradient(180deg,#2D1F3D,#150E1F)]'>
                <p className='mt-12 text-center text-[10px] tracking-[0.25em] text-white/50'>POWERED BY</p>
                <p className='text-center text-[18px] font-bold'>passprivé</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'revealed' && (
        <div className='flex flex-1 flex-col items-center overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))]'>
          <div className='mt-4 w-full max-w-sm overflow-hidden rounded-3xl bg-white text-[#1A1A1A] shadow-[0_16px_40px_rgba(0,0,0,0.45)] animate-in fade-in zoom-in-95 duration-500'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt='' className='h-52 w-full object-cover' />
            <div className='p-5'>
              <p className='text-[14px] font-semibold text-[#6B6B6B]'>{recipient}</p>
              <p className='mt-1 text-[22px] font-bold'>{title}</p>
              <p className='mt-2 text-[14px] leading-5 text-[#4A4A4A]'>{message}</p>
              <p className='mt-3 text-right text-[14px] font-semibold'>- {sender}</p>
              <p className='mt-4 text-center text-[11px] text-[#8A8A8E]'>Powered by <span className='font-bold text-[#1A1A1A]'>passprivé</span></p>
            </div>
          </div>
          <button type='button' onClick={() => { setScene(0); setPhase('claim') }} className='mt-6 h-13 w-full max-w-sm rounded-full bg-[#FF4800] text-[16px] font-semibold text-white hover:bg-[#E64100]'>
            View my gift
          </button>
        </div>
      )}

      {phase === 'claim' && (
        <div className='flex flex-1 flex-col items-center justify-center px-5 text-center'>
          {scene === 0 && (
            <div className='animate-in fade-in duration-500'>
              <div className='mx-auto flex size-28 animate-bounce items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#FF4800,#FFAA7C)] text-[56px]'>🎁</div>
              <p className='mt-6 text-[22px] font-bold'>You received a gift</p>
            </div>
          )}
          {scene === 1 && (
            <div className='animate-in fade-in zoom-in-90 duration-500'>
              <Sparkles className='mx-auto size-10 text-[#FFD24D]' />
              <p className='mt-3 font-(family-name:--font-libre-baskerville) text-[34px] font-bold italic'>Congratulations</p>
            </div>
          )}
          {scene === 2 && (
            <div className={cn('w-full max-w-sm rounded-3xl border border-dashed border-white/25 bg-white/5 p-6 animate-in fade-in slide-in-from-bottom-6 duration-500')}>
              <p className='text-[13px] font-bold tracking-[0.18em] text-[#FFB27A]'>GIFT SUCCESSFULLY UNLOCKED</p>
              <div className='mx-auto my-4 h-px w-16 bg-white/25' />
              <p className='text-[40px] font-black'>{amount.toLocaleString('en-US')}</p>
              <p className='text-[15px] text-white/80'>PassPrivé Coins Added</p>
              <p className='mt-4 text-[12px] leading-[18px] text-white/60'>
                * {amount.toLocaleString('en-US')} Coins are now available in your wallet activity. Use them to check out brands instantly.
              </p>
              <button type='button' onClick={onClose} className='mt-6 h-12 w-full rounded-full bg-white text-[15px] font-semibold text-[#1A1A1A] hover:bg-white/90'>
                Go to Gifts Home
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
