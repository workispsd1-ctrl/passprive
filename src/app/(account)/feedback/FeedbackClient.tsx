'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Star } from 'lucide-react'

/** Stars + a message, once per person — app parity: FeedbackScreen.jsx. */
export function FeedbackClient({ alreadyGiven }: { alreadyGiven: boolean }) {
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [already, setAlready] = useState(alreadyGiven)
  const [error, setError] = useState('')

  async function submit() {
    if (busy || !rating || !message.trim()) return
    setBusy(true)
    setError('')
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, message }),
    }).catch(() => null)
    const data = (await res?.json().catch(() => null)) as { alreadyGiven?: boolean; error?: string } | null
    setBusy(false)
    if (data?.alreadyGiven) { setAlready(true); return }
    if (!res?.ok) { setError(data?.error ?? 'Could not send your feedback. Please try again.'); return }
    setDone(true)
  }

  if (done || already) {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center'>
        <CheckCircle className='size-14 text-brand' strokeWidth={1.5} />
        <h1 className='mt-4 text-xl font-bold text-[#2C2D32]'>{done ? 'Thank you!' : 'Feedback already shared'}</h1>
        <p className='mt-2 text-sm leading-6 text-[#6B6B6B]'>
          {done
            ? 'Your feedback helps a lot — we really appreciate you taking the time to share it with us.'
            : 'You have already shared your feedback with us — thank you. Reach out through Support if there is anything else.'}
        </p>
        <Link href='/' className='mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand font-semibold text-white hover:bg-brand-dark'>Back to Home</Link>
      </div>
    )
  }

  return (
    <div className='mx-auto flex max-w-md flex-col px-6 py-8'>
      <h1 className='text-center text-2xl font-bold text-[#2C2D32]'>
        Enjoying <span className='font-(family-name:--font-libre-baskerville) italic'>Passprivé</span> so far?
      </h1>
      <div className='mt-5 flex justify-center gap-2'>
        {[1, 2, 3, 4, 5].map(value => (
          <button key={value} type='button' aria-label={`${value} star${value === 1 ? '' : 's'}`} aria-pressed={value === rating} onClick={() => setRating(value)}>
            <Star className={value <= rating ? 'size-9 fill-[#FFB400] text-[#FFB400]' : 'size-9 text-[#D5D5D5]'} />
          </button>
        ))}
      </div>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={5}
        aria-label='Your feedback'
        className='mt-6 rounded-2xl border border-[#E2E1E1] p-4 text-sm outline-none focus:border-brand'
      />
      <p className='mt-2 text-[13px] text-[#6B6B6B]'>Tell us what you love about the app, or what we could be doing better.</p>
      {error && <p role='alert' className='mt-3 text-sm font-semibold text-red-600'>{error}</p>}
      <button
        type='button'
        disabled={busy || !rating || !message.trim()}
        onClick={submit}
        className='mt-6 h-12 rounded-full bg-brand font-semibold text-white hover:bg-brand-dark disabled:bg-[#C9C9CE]'
      >
        {busy ? 'Sending…' : 'Submit feedback'}
      </button>
    </div>
  )
}
