'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import QRCode from 'qrcode'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Dialog, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import { appDownloadUrl } from '@/lib/appLinks'
import { HuntSpot } from '@/components/hunt/HuntSpot'
import { formatPct, type BlackPlan } from '@/lib/receipts'
import { cn } from '@/lib/utils'

/**
 * Figma "Flow Redeem Deal" (css.txt): the "Today's Offer" Black upgrade and the
 * "Download the PassPrivé App" desktop pop-up. Both frames are 1920 wide and
 * every class is the exact Figma value in design px: `--u` is 1px on a 1920
 * screen and proportional on other desktop widths; phones keep 1px. The unit
 * lives on the portalled popup itself.
 */
const UNIT = '[--u:1px] lg:[--u:calc(100vw/1920)] [--spacing:var(--u)]'

/** Figma "close": 32 box, #595961 cross inset 20.83%. */
function CloseButton() {
  return (
    <DialogPrimitive.Close aria-label='Close' className='flex size-32 shrink-0 items-center justify-center rounded-full text-[#595961] outline-none transition-colors hover:bg-[#F2F2F2] focus-visible:bg-[#F2F2F2]'>
      <svg viewBox='0 0 24 24' className='size-32' fill='currentColor' aria-hidden>
        <path d='M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
      </svg>
    </DialogPrimitive.Close>
  )
}

/** Overlay rgba(0,0,0,0.33) + a centred white card. */
function Popup({ open, onClose, className, children }: {
  open: boolean
  onClose: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogPortal>
        <DialogOverlay className='z-110 bg-black/33 supports-backdrop-filter:backdrop-blur-none' />
        <DialogPrimitive.Popup
          className={cn(
            'fixed top-1/2 left-1/2 z-110 flex max-h-[calc(100dvh-32px)] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-[calc(24*var(--u))] bg-white font-(family-name:--font-dm-sans) outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            UNIT,
            className,
          )}
        >
          {children}
          {/* app parity: AnimatedSheet.jsx "sheet" hunt slot */}
          <HuntSpot slot='sheet' />
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  )
}

/* ───────────────────────── Today's Offer ───────────────────────── */

const SPARKLE = 'M10.9694 4.28112L10.1331 0L9.29687 4.28112C9.02179 5.6894 8.37222 6.98107 7.42732 7.99865C6.48242 9.01624 5.28301 9.71577 3.97533 10.012L0 10.9126L3.97533 11.8132C5.28299 12.1094 6.48241 12.809 7.42732 13.8266C8.37222 14.8442 9.02179 16.1358 9.29687 17.5441L10.1331 21.8252L10.9694 17.5441C11.2445 16.1358 11.894 14.8442 12.8389 13.8266C13.7839 12.809 14.9832 12.1094 16.291 11.8132L20.2663 10.9126L16.291 10.012C14.9832 9.71577 13.7838 9.01624 12.8389 7.99865C11.894 6.98107 11.2445 5.6894 10.9694 4.28112Z'
const TAG = 'M19.4 12.25L12.25 19.4C12.05 19.6 11.825 19.75 11.575 19.85C11.325 19.95 11.075 20 10.825 20C10.575 20 10.325 19.95 10.075 19.85C9.825 19.75 9.6 19.6 9.4 19.4L0.575 10.575C0.391667 10.3917 0.25 10.1792 0.15 9.9375C0.05 9.69583 0 9.44167 0 9.175V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H9.175C9.44167 0 9.7 0.0541667 9.95 0.1625C10.2 0.270833 10.4167 0.416667 10.6 0.6L19.4 9.425C19.6 9.625 19.7458 9.85 19.8375 10.1C19.9292 10.35 19.975 10.6 19.975 10.85C19.975 11.1 19.9292 11.3458 19.8375 11.5875C19.7458 11.8292 19.6 12.05 19.4 12.25ZM4.5 6C4.91667 6 5.27083 5.85417 5.5625 5.5625C5.85417 5.27083 6 4.91667 6 4.5C6 4.08333 5.85417 3.72917 5.5625 3.4375C5.27083 3.14583 4.91667 3 4.5 3C4.08333 3 3.72917 3.14583 3.4375 3.4375C3.14583 3.72917 3 4.08333 3 4.5C3 4.91667 3.14583 5.27083 3.4375 5.5625C3.72917 5.85417 4.08333 6 4.5 6Z'
const TAG_STRING = 'M13.5493 8.54488C8.8826 9.04488 -0.250729 8.64488 0.549271 3.04488C1.34927 -2.55512 7.88261 2.37821 11.0493 5.54488'

function formatMur(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n.toLocaleString('en-US') : null
}

/** app parity: BlackUpgradeSheet periodLabel — "1 year" → "For 1 year", "3 months" → "For next 3 months". */
function periodLabel(type: string | null | undefined) {
  const m = String(type ?? '').match(/(\d+)\s*(year|month)/i)
  if (!m) return null
  const count = Number(m[1])
  const unit = m[2].toLowerCase()
  return count === 1 ? `For 1 ${unit}` : `For next ${count} ${unit}s`
}

/** Figma "Prive Black unit": 89 × 38.14 pill, gold glow, "Privé" Libre Baskerville + "Black" #FFC53D. */
function BlackUnit({ className }: { className?: string }) {
  const shadow = '[text-shadow:0_calc(3.72272*var(--u))_calc(3.72272*var(--u))_rgba(0,0,0,0.1)]'
  return (
    <span aria-label='Privé Black' className={cn('absolute h-[calc(38.14*var(--u))] w-89 overflow-hidden rounded-[calc(27.9714*var(--u))] bg-[#0E0C18]', className)}>
      <span
        aria-hidden
        className='absolute top-[calc(-30.04*var(--u))] left-[calc(-24.27*var(--u))] h-[calc(25.66*var(--u))] w-[calc(115.6*var(--u))] rotate-[-9.48deg] rounded-full bg-[#BF9531] blur-[calc(11.7915*var(--u))]'
      />
      <span aria-hidden className={cn('absolute top-[calc(11.76*var(--u))] left-[calc(9.25*var(--u))] font-(family-name:--font-libre-baskerville) text-[calc(12.8476*var(--u))] leading-16 font-bold tracking-[-0.03em] whitespace-nowrap text-[#FFF6F2] italic', shadow)}>
        Privé
      </span>
      <span aria-hidden className={cn('absolute top-[calc(8.85*var(--u))] left-[calc(42.57*var(--u))] text-[calc(15.5456*var(--u))] leading-20 font-extrabold tracking-[-0.07em] whitespace-nowrap text-[#FFC53D]', shadow)}>
        Black
      </span>
    </span>
  )
}

/**
 * "Get 3% instead of 0.5%" — app parity: components/BlackUpgradeSheet.jsx,
 * laid out on Figma "TODAY'S OFFER" (560 × 574). Copy and prices come from the
 * live Black plan; `onContinue` adds the app's secondary "… at x%" link.
 */
export function TodaysOfferDialog({
  open,
  currentPct,
  blackPct,
  plan,
  onClose,
  onContinue,
  continueLabel,
}: {
  open: boolean
  currentPct: number
  blackPct: number
  plan: BlackPlan | null
  onClose: () => void
  onContinue?: () => void
  continueLabel?: string
}) {
  const price = formatMur(plan?.amount)
  const struck = formatMur(plan?.original_amount)
  const period = periodLabel(plan?.type)
  const planName = String(plan?.plan_name ?? '').trim() || 'Privé Black'

  return (
    <Popup
      open={open}
      onClose={onClose}
      className='w-560 shadow-[0_calc(24*var(--u))_calc(48*var(--u))_rgba(0,0,0,0.101961)] lg:-translate-y-[calc(50%+62*var(--u))]'
    >
      {/* header: 20/24 padding, 72 tall */}
      <div className='flex h-72 shrink-0 items-center justify-between px-24 py-20'>
        <p className='text-[calc(14*var(--u))] leading-18 font-semibold tracking-[0.2em] text-[#666666]'>TODAY’S OFFER</p>
        <CloseButton />
      </div>

      {/* content: 560 × 400 */}
      <div className='flex flex-col items-center px-16 pt-32 pb-25 text-center'>
        <span className='relative'>
          <DialogTitle className='bg-[linear-gradient(94.59deg,#FF6A30_14.2%,#0E21DA_61.5%)] bg-clip-text pr-4 text-[calc(56*var(--u))] leading-54 font-bold tracking-[calc(-3*var(--u))] whitespace-nowrap text-transparent italic'>
            Get {formatPct(blackPct)}
          </DialogTitle>
          {/* "Group 2085665736": the price tag (rotated 15.74°) on its string, at the headline's top right */}
          <svg aria-hidden viewBox='0 0 13.6025 9.20292' className='absolute top-0 left-[calc(100%-9.7*var(--u))] h-[calc(8.49*var(--u))] w-[calc(13.05*var(--u))]' fill='none'>
            <path d={TAG_STRING} stroke='#666666' />
          </svg>
          <svg aria-hidden viewBox='0 0 19.975 20' className='absolute top-[calc(3.29*var(--u))] left-[calc(100%-5.13*var(--u))] h-20 w-[calc(19.98*var(--u))] rotate-[15.74deg]'>
            <path d={TAG} fill='#FF6A30' />
          </svg>
        </span>

        <span className='relative mt-8'>
          <svg aria-hidden viewBox='0 0 20.2663 21.8252' className='absolute top-24 -left-26 h-[calc(21.83*var(--u))] w-[calc(20.27*var(--u))] -scale-x-100 rotate-[13deg]'>
            <path d={SPARKLE} fill='#F5EEF7' />
          </svg>
          <p className='text-[calc(39.858*var(--u))] leading-45 font-semibold tracking-[-0.09em] whitespace-nowrap text-[#666666]'>
            instead of {formatPct(currentPct)}
          </p>
        </span>

        <DialogDescription className='mt-27 w-348 max-w-full text-[calc(20*var(--u))] leading-26 text-[#666666]'>
          If you upgrade to <span className='font-semibold text-[#2C2D32] italic'>{planName}</span>
          {price ? ' at a special rate of' : ''}
        </DialogDescription>

        {price && (
          <>
            <div className='mt-18 w-224'>
              <p className={cn('h-26 text-left text-[calc(20*var(--u))] leading-26 text-[#D72828] line-through', !(struck && struck !== price) && 'invisible')}>
                {struck} MUR
              </p>
              <div className='relative mt-2 flex h-80 items-center justify-center rounded-[calc(20*var(--u))] border border-[#BABABA] bg-[#F2F2F2] px-13 text-[#2C2D32]'>
                <p className='truncate text-center leading-78'>
                  <span className='text-[calc(60*var(--u))] font-black italic'>{price}</span>
                  <span className='text-[calc(32*var(--u))]'> MUR</span>
                </p>
                <BlackUnit className='-top-18 left-135' />
              </div>
            </div>
            {period && <p className='mt-10 text-[calc(16*var(--u))] leading-21 text-[#666666]'>{period}</p>}
          </>
        )}
      </div>

      {/* footer: 24 padding, top rule #E6E0E9 */}
      <div className='flex shrink-0 flex-col items-center gap-12 border-t border-[#E6E0E9] p-24'>
        <Link
          href='/membership'
          onClick={onClose}
          className='flex h-54 w-354 max-w-full items-center justify-center rounded-[calc(27*var(--u))] bg-[#FF4800] text-[calc(16*var(--u))] leading-21 font-semibold tracking-[-0.02em] text-white transition-opacity hover:opacity-90'
        >
          Upgrade Now
        </Link>
        {onContinue && (
          <button type='button' onClick={onContinue} className='text-[calc(14*var(--u))] leading-18 font-medium text-[#6B7280] underline hover:text-[#2C2D32]'>
            {continueLabel ?? `Continue at ${formatPct(currentPct)}`}
          </button>
        )}
      </div>
    </Popup>
  )
}

/* ───────────────────────── Download the app ───────────────────────── */

/** The download link as an SVG QR (error correction H, so the logo can sit on top). */
function QrCode({ value, className }: { value: string; className?: string }) {
  const { size, path } = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: 'H' })
    let d = ''
    for (let r = 0; r < modules.size; r++) {
      for (let c = 0; c < modules.size; c++) {
        if (modules.get(r, c)) d += `M${c} ${r}h1v1h-1z`
      }
    }
    return { size: modules.size, path: d }
  }, [value])
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} shapeRendering='crispEdges' aria-hidden>
      <path d={path} fill='#000000' />
    </svg>
  )
}

/** Figma "Frame 2147225005": 64 orange disc, 5 white ring, the PassPrivé keyhole mark. */
function QrLogo() {
  return (
    <span className='absolute top-[calc(50%+0.5*var(--u))] left-1/2 flex size-64 -translate-1/2 items-center justify-center overflow-hidden rounded-full border-[calc(5*var(--u))] border-white bg-[linear-gradient(180deg,#FFA582_-63.76%,#FF4800_100%)]'>
      <svg viewBox='0 0 54 54' className='size-54' aria-hidden>
        <defs>
          <linearGradient id='qr-arc' x1='0' y1='1' x2='1' y2='0'>
            <stop offset='0.09' stopColor='#FFFFFF' />
            <stop offset='1' stopColor='#F37847' />
          </linearGradient>
          <linearGradient id='qr-key' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0' stopColor='#FFFFFF' />
            <stop offset='1' stopColor='#FFD9C8' />
          </linearGradient>
        </defs>
        <path d='M12 30C11 18 20 10 30 10.4C42 11 50 21 46 33C44.5 38 41 41.5 36.5 42C40 35 38.5 25 30.5 20.5C24 17 16.5 21 12 30Z' fill='url(#qr-arc)' />
        <circle cx='28.5' cy='36' r='6.3' fill='url(#qr-key)' />
        <rect x='24.1' y='36' width='8.9' height='21' rx='2.4' fill='url(#qr-key)' />
      </svg>
    </span>
  )
}

/** Figma corner brackets: 27.03 squares, 2.7027 #FF4800, two sides each. */
const BRACKET = 'absolute size-[calc(27.03*var(--u))] border-[#FF4800]'
const BRACKET_W = 'calc(2.7027*var(--u))'

/** Why the visitor is being sent to the app — picks the pop-up's line. */
export type AppPromptReason = 'deal' | 'cashback'

const APP_PROMPT_LINE: Record<AppPromptReason, { qr: string; phone: string }> = {
  deal: {
    qr: 'Scan the QR code to get the app and redeem deals using Phone PIN and NFC.',
    phone: 'Get the app to redeem deals using Phone PIN and NFC.',
  },
  cashback: {
    qr: 'Scan the QR code to get the app and earn cashback as Privé Credits on every bill.',
    phone: 'Get the app to earn cashback as Privé Credits on every bill.',
  },
}

/**
 * "Download the PassPrivé App" — Figma "Tap Unsuccessful - Desktop Pop-up"
 * (480 × 543). Deals are redeemed and cashback earned in the app, so the web
 * sends visitors there: a QR code on desktop, a store button on phones.
 */
export function DownloadAppDialog({ open, onClose, reason = 'deal' }: { open: boolean; onClose: () => void; reason?: AppPromptReason }) {
  const url = appDownloadUrl()
  const line = APP_PROMPT_LINE[reason]
  return (
    <Popup open={open} onClose={onClose} className='w-480 items-center gap-24 p-32 shadow-[0_calc(4*var(--u))_calc(12*var(--u))_rgba(0,0,0,0.08)] max-lg:px-20'>
      <div className='flex h-32 w-full shrink-0 items-center justify-between'>
        <span className='size-32' aria-hidden />
        <CloseButton />
      </div>

      <div className='flex w-full flex-col items-center gap-8 text-center'>
        <DialogTitle className='text-[calc(24*var(--u))] leading-31 font-black text-[#2C2D32]'>Download the PassPrivé App</DialogTitle>
        <DialogDescription className='text-[calc(14*var(--u))] leading-18 font-semibold text-[#666666]'>
          <span className='max-lg:hidden'>{line.qr}</span>
          <span className='lg:hidden'>{line.phone}</span>
        </DialogDescription>
      </div>

      {/* phones: a QR can't be scanned from its own screen — /get-app opens the right store */}
      <a
        href='/get-app'
        className='flex h-48 w-full shrink-0 items-center justify-center rounded-full bg-[#FF4800] text-[16px] font-semibold text-white hover:bg-[#E64200] lg:hidden'
      >
        Get the app
      </a>

      <a
        href={url}
        target='_blank'
        rel='noopener noreferrer'
        aria-label='Get the PassPrivé app'
        className='relative size-200 shrink-0 rounded-[calc(28*var(--u))] border border-[#F6F6F6] bg-white max-lg:hidden'
      >
        <QrCode value={url} className='absolute top-[calc(50%+0.68*var(--u))] left-[calc(50%+0.68*var(--u))] h-[calc(158.11*var(--u))] w-[calc(155.41*var(--u))] -translate-1/2' />
        <span className={cn(BRACKET, 'top-[calc(13.51*var(--u))] left-[calc(16.22*var(--u))] rounded-tl-[calc(4*var(--u))] border-t-(length:--b) border-l-(length:--b)')} style={{ ['--b' as string]: BRACKET_W }} />
        <span className={cn(BRACKET, 'top-[calc(13.51*var(--u))] right-[calc(13.51*var(--u))] rounded-tr-[calc(4*var(--u))] border-t-(length:--b) border-r-(length:--b)')} style={{ ['--b' as string]: BRACKET_W }} />
        <span className={cn(BRACKET, 'bottom-[calc(13.51*var(--u))] left-[calc(16.22*var(--u))] rounded-bl-[calc(4*var(--u))] border-b-(length:--b) border-l-(length:--b)')} style={{ ['--b' as string]: BRACKET_W }} />
        <span className={cn(BRACKET, 'right-[calc(13.51*var(--u))] bottom-[calc(13.51*var(--u))] rounded-br-[calc(4*var(--u))] border-r-(length:--b) border-b-(length:--b)')} style={{ ['--b' as string]: BRACKET_W }} />
        <QrLogo />
      </a>

      {/* "3D Smartphone QR Download Icon" */}
      <Image src='/assets/deals/redeem-nfc-phone.webp' alt='' width={200} height={200} className='size-100 shrink-0 object-contain' />
    </Popup>
  )
}

/** Desktop: no NFC and a mouse — redeeming at the counter happens in the app. */
export function isDesktopRedeem() {
  if (typeof window === 'undefined') return false
  if ('NDEFReader' in window) return false
  return window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches
}
