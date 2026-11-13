'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, Share2 } from 'lucide-react'
import { usePlatformFlags } from '@/lib/context/PlatformFlagsContext'
import { cn } from '@/lib/utils'
import { describeReferralError } from '@/lib/referral'

type Referral = {
  enabled?: boolean
  code?: string
  reward_amount?: number
  referee_amount?: number
  min_bill?: number
  max_total?: number
  earned?: number
  invited?: number
  can_apply?: boolean
  joined_with?: string | null
  welcome_status?: string | null
  welcome_amount?: number
  welcome_min_bill?: number
}

const describeError = describeReferralError

const fmt = (n: unknown) => Number(n || 0).toLocaleString('en-US')

/** The torn referral ticket — app parity: ReferFriendScreen Ticket. */
function Ticket({ info }: { info: Referral }) {
  return (
    <div className='relative w-full overflow-hidden rounded-[18px] border border-[#E9DDFB] bg-white text-center shadow-[0_12px_30px_rgba(56,16,124,0.18)]'>
      <div className='px-6 pt-6 pb-5'>
        <p className='text-[15px] text-[#6B7280]'>Hey friend,</p>
        <p className='mt-1 text-[26px] leading-8 font-bold text-[#1A1A1A]'>
          <span className='text-[#38107C]'>MUR {fmt(info.referee_amount)}</span>
          <br />referral cash for you
        </p>
      </div>
      <div className='relative mx-5 border-t-2 border-dashed border-[#E9DDFB]'>
        <span className='absolute -top-3 -left-8 h-6 w-6 rounded-full border border-[#E9DDFB] bg-white' />
        <span className='absolute -top-3 -right-8 h-6 w-6 rounded-full border border-[#E9DDFB] bg-white' />
      </div>
      <div className='px-6 pt-5 pb-6'>
        <p className='text-[12px] text-[#6B7280]'>Sign up with code</p>
        <p className='mx-auto mt-2 w-fit rounded-xl bg-[#F5EFFF] px-5 py-2.5 text-[26px] font-bold tracking-[4px] text-[#38107C] select-all'>{info.code}</p>
        <p className='mt-3 text-[12px] leading-[17px] text-[#6B7280]'>
          Credited after your first bill of MUR {fmt(info.min_bill)} or more paid through PassPrivé.
        </p>
        <p className='mt-3 text-[13px] font-bold text-[#38107C]'>PassPrivé</p>
      </div>
    </div>
  )
}

function Step({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <li className='flex gap-3'>
      <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#38107C] text-[13px] font-bold text-white'>{index}</span>
      <span>
        <span className='block text-[15px] font-semibold text-[#1A1A1A]'>{title}</span>
        <span className='mt-0.5 block text-[13px] leading-5 text-[#6B7280]'>{body}</span>
      </span>
    </li>
  )
}

/**
 * Refer a friend — app parity: screens/ReferFriendScreen.jsx: the reward
 * header and progress, "Lift the lid" to reveal the ticket, share it, how it
 * works, and entering a friend's code before the first bill.
 */
export function ReferFriendClient() {
  const flags = usePlatformFlags()
  const [info, setInfo] = useState<Referral | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'opening' | 'done'>('idle')
  const [code, setCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [applyMessage, setApplyMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [shared, setShared] = useState(false)

  const load = useCallback(() => {
    fetch('/api/referral', { cache: 'no-store' })
      .then(res => (res.ok ? (res.json() as Promise<Referral>) : Promise.reject(new Error('referral'))))
      .then(data => { setInfo(data); setLoadError(false) })
      .catch(() => setLoadError(true))
  }, [])

  useEffect(() => { load() }, [load])

  const open = () => {
    if (phase !== 'idle' || !info) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setPhase('done'); return }
    setPhase('opening')
    setTimeout(() => setPhase('done'), 900)
  }

  const share = async () => {
    if (!info?.code) return
    const text = Number(info.referee_amount) > 0
      ? `Hey! Get MUR ${fmt(info.referee_amount)} referral cash on PassPrivé, the best deals app in Mauritius. Sign up with my code ${info.code} and it's credited after your first bill.`
      : `Join me on PassPrivé, the best deals app in Mauritius! Sign up with my code ${info.code}.`
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {})
      return
    }
    await navigator.clipboard?.writeText(text).then(() => setShared(true)).catch(() => {})
  }

  const apply = async () => {
    const value = code.trim()
    if (!value || applying) return
    setApplying(true)
    setApplyMessage(null)
    try {
      const res = await fetch('/api/referral', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: value }) })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; code?: string; referee_amount?: number; min_bill?: number } | null
      if (data?.ok) {
        setApplyMessage({ ok: true, text: `Code added. You get MUR ${fmt(data.referee_amount)} after your first bill of MUR ${fmt(data.min_bill)} or more.` })
        setCode('')
        load()
      } else {
        setApplyMessage({ ok: false, text: describeError(data?.code) })
      }
    } catch {
      setApplyMessage({ ok: false, text: 'No connection. Try again.' })
    } finally {
      setApplying(false)
    }
  }

  const rewardAmount = info?.reward_amount ?? flags.referralAmount
  const refereeAmount = info?.referee_amount ?? flags.referralRefereeAmount
  const maxTotal = Number(info?.max_total) || 0
  const earned = Number(info?.earned) || 0
  const invited = Number(info?.invited) || 0
  const capReached = maxTotal > 0 && earned >= maxTotal
  const lifted = phase !== 'idle'

  return (
    <div className='mx-auto max-w-xl px-5 pt-5 pb-16 font-(family-name:--font-dm-sans)'>
      <section className='rounded-3xl bg-[linear-gradient(135deg,#4A169E,#38107C)] px-5 py-5 text-white'>
        <h1 className='text-[20px] font-bold'>Earn MUR {fmt(rewardAmount)} for every friend</h1>
        {maxTotal > 0 && (
          <>
            <p className='mt-1 text-[13px] text-[#D9C2FF]'>Collect up to MUR {fmt(maxTotal)}</p>
            <div className='mt-3 h-2 overflow-hidden rounded-full bg-white/20'>
              <div className='h-full rounded-full bg-[#FFD24D]' style={{ width: `${Math.min(100, (earned / maxTotal) * 100)}%` }} />
            </div>
            <div className='mt-2 flex justify-between text-[12px]'>
              <span className='font-bold'>MUR {fmt(earned)} earned</span>
              <span className='text-[#D9C2FF]'>{fmt(invited)} {invited === 1 ? 'friend' : 'friends'} joined</span>
            </div>
          </>
        )}
      </section>

      {!info || !info.enabled ? (
        <div className='flex min-h-60 items-center justify-center text-center text-[14px] text-[#6B7280]'>
          {!info ? (
            loadError
              ? <button type='button' onClick={load} className='font-semibold text-[#38107C] underline'>Couldn&apos;t load your referral. Tap to retry.</button>
              : <Loader2 className='h-6 w-6 animate-spin text-[#38107C]' />
          ) : (
            <p>Referrals are paused right now. Check back soon.</p>
          )}
        </div>
      ) : (
        <>
          {/* the dish: lift the lid to reveal the ticket — app parity: ReferFriendScreen stage */}
          <section className='relative mt-6 flex flex-col items-center'>
            {phase === 'idle' && (
              <div className='text-center'>
                <p className='text-[20px] font-bold text-[#1A1A1A]'>Your treat is ready</p>
                <p className='mt-1 text-[14px] text-[#6B7280]'>Lift the lid to reveal your referral ticket</p>
              </div>
            )}
            <div className={cn('w-full max-w-90 transition-all duration-700 ease-out', lifted ? 'mt-2 scale-100 opacity-100' : 'pointer-events-none h-0 scale-50 opacity-0')}>
              {lifted && <Ticket info={info} />}
            </div>
            <div className='relative mt-4 w-full max-w-75'>
              <Image src='/assets/refer/plate.svg' alt='' width={300} height={96} className='w-full' unoptimized />
              <button
                type='button'
                onClick={open}
                disabled={phase !== 'idle'}
                aria-label='Lift the lid to reveal your referral ticket'
                className={cn(
                  'absolute bottom-[38%] left-1/2 w-[82%] origin-bottom-right -translate-x-1/2 transition-transform duration-700 ease-out',
                  lifted && 'translate-x-[10%] -translate-y-[115%] rotate-[22deg] opacity-0',
                  phase === 'idle' && 'animate-[wiggle_2.4s_ease-in-out_infinite]',
                )}
              >
                <Image src='/assets/refer/lid.svg' alt='' width={260} height={210} className='w-full' unoptimized />
              </button>
            </div>
            {phase === 'idle' ? (
              <button type='button' onClick={open} className='mt-4 h-13 rounded-full bg-[#38107C] px-8 text-[16px] font-semibold text-white hover:bg-[#4A169E]'>
                Tap to open
              </button>
            ) : phase === 'done' ? (
              <button type='button' onClick={share} className='mt-4 flex h-13 items-center gap-2 rounded-full bg-[#38107C] px-8 text-[16px] font-semibold text-white hover:bg-[#4A169E]'>
                <Share2 className='h-4.5 w-4.5' strokeWidth={2.2} /> {shared ? 'Copied — paste it to a friend' : 'Share with friends'}
              </button>
            ) : null}
          </section>

          <section className='mt-10'>
            <h2 className='text-[18px] font-bold text-[#1A1A1A]'>How it works</h2>
            <ol className='mt-4 space-y-4'>
              <Step index={1} title='Share your code' body='Send your ticket to friends on WhatsApp, Instagram or anywhere.' />
              <Step index={2} title='They sign up with it' body='Your friend enters your code when they create their account.' />
              <Step
                index={3}
                title='You both get rewarded'
                body={
                  capReached
                    ? `You've reached the MUR ${fmt(maxTotal)} limit, but your friend still gets MUR ${fmt(refereeAmount)} after their first bill of MUR ${fmt(info.min_bill)} or more.`
                    : `After their first bill of MUR ${fmt(info.min_bill)} or more through PassPrivé, you get MUR ${fmt(rewardAmount)} and they get MUR ${fmt(refereeAmount)}.`
                }
              />
            </ol>

            {info.can_apply ? (
              <div className='mt-8 rounded-2xl border border-[#E5E7EB] p-4'>
                <p className='text-[15px] font-semibold text-[#1A1A1A]'>Got a friend&apos;s code?</p>
                <form onSubmit={e => { e.preventDefault(); apply() }} className='mt-3 flex gap-2'>
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder='Enter code'
                    maxLength={12}
                    autoCapitalize='characters'
                    autoCorrect='off'
                    aria-label="Friend's referral code"
                    className='h-12 min-w-0 flex-1 rounded-xl border border-[#E5E7EB] px-4 text-[15px] tracking-wider uppercase outline-none focus:border-[#38107C]'
                  />
                  <button type='submit' disabled={!code.trim() || applying} className='flex h-12 w-24 items-center justify-center rounded-xl bg-[#38107C] text-[15px] font-semibold text-white disabled:opacity-40'>
                    {applying ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Apply'}
                  </button>
                </form>
                {applyMessage && <p className={cn('mt-2 text-[13px]', applyMessage.ok ? 'text-[#2E7D32]' : 'text-[#D93025]')}>{applyMessage.text}</p>}
              </div>
            ) : info.joined_with ? (
              <p className='mt-8 text-[13px] text-[#6B7280]'>
                {info.welcome_status === 'rewarded'
                  ? `You joined with code ${info.joined_with} and got MUR ${fmt(info.welcome_amount)}.`
                  : `You joined with code ${info.joined_with}. You get MUR ${fmt(info.welcome_amount)} after your first bill of MUR ${fmt(info.welcome_min_bill)} or more.`}
              </p>
            ) : null}
          </section>
        </>
      )}
    </div>
  )
}
