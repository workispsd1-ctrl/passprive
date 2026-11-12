import Link from 'next/link'

/**
 * Floating "Refer & earn" seal on Profile — app parity: components/ReferBadge.jsx
 * (shown while referrals are on; opens Refer a friend).
 */
export function ReferBadge({ amount }: { amount: number }) {
  const label = Number(amount).toLocaleString('en-US')
  return (
    <Link
      href='/refer'
      aria-label={`Refer and earn ${label} PassPrivé points`}
      className='fixed right-[20px] bottom-[max(20px,env(safe-area-inset-bottom))] z-40 block size-[96px] transition-transform hover:scale-105'
    >
      <svg viewBox='0 0 96 96' className='absolute inset-0 size-full animate-[spin_14s_linear_infinite] motion-reduce:animate-none' aria-hidden>
        <defs>
          <path id='referRing' d='M48,48 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0' />
        </defs>
        <circle cx='48' cy='48' r='46' fill='#38107C' />
        <text fill='#FFFFFF' fontSize='7.4' fontWeight='700' letterSpacing='0.55'>
          <textPath href='#referRing'>{`REFER & EARN • ${label} PASSPRIVE POINTS • `}</textPath>
        </text>
      </svg>
      <span className='absolute inset-[25px] flex flex-col items-center justify-center rounded-full bg-[#DFBEFF] text-[#38107C]'>
        <span className='text-[15px] leading-4 font-bold'>{label}</span>
        <span className='text-[9px] font-semibold'>points</span>
      </span>
    </Link>
  )
}
