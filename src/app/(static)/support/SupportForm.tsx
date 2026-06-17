'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const TOPICS = [
  'Dining / Stores',
  'Booking Issue',
  'Payment Issue',
  'Membership Upgrade',
  'Account',
  'Other',
]

const PLAN_DEFAULTS: Record<string, { topic: string; message: string }> = {
  premium: {
    topic: 'Membership Upgrade',
    message: "Hi PassPrivé team,\n\nI'd like to subscribe to Privé Premium (Rs 4,000/year).\n\nPlease let me know the next steps to activate my membership.\n\nThank you.",
  },
  black: {
    topic: 'Membership Upgrade',
    message: "Hi PassPrivé team,\n\nI'd like to subscribe to Privé Black (Rs 7,000/year).\n\nPlease let me know the next steps to activate my membership.\n\nThank you.",
  },
}

export function SupportForm() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') ?? ''
  const planDefaults = PLAN_DEFAULTS[plan] ?? null

  const [topic, setTopic] = useState(planDefaults?.topic ?? TOPICS[0])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [message, setMessage] = useState(planDefaults?.message ?? '')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (planDefaults) {
      setTopic(planDefaults.topic)
      setMessage(planDefaults.message)
    }
  }, [plan])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, name, email, mobile, message }),
    })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-semibold text-gray-800">
          {plan ? 'Membership request received!' : 'Thank you for reaching out!'}
        </p>
        <p className="text-gray-500 mt-2">
          {plan
            ? "We'll review your request and activate your membership within 24 hours."
            : "We'll get back to you within 24 hours."}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 items-start">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {plan && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800 font-medium">
            Requesting: <span className="font-bold">{plan === 'premium' ? 'Privé Premium — Rs 4,000/year' : 'Privé Black — Rs 7,000/year'}</span>
          </div>
        )}

        <select
          aria-label="Topic"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand"
        >
          {TOPICS.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <input
          type="text"
          required
          placeholder="Full name *"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand"
        />

        <input
          type="email"
          required
          placeholder="Email address *"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand"
        />

        <input
          type="tel"
          required
          placeholder="Mobile number *"
          value={mobile}
          onChange={e => setMobile(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand"
        />

        <textarea
          required
          placeholder="Briefly describe your issue here *"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={5}
          className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand resize-none"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 text-sm font-medium rounded-md transition-colors"
          >
            {loading ? 'Sending…' : plan ? 'Request Membership' : 'Submit'}
          </button>
        </div>
      </form>

      <div className="md:w-72 shrink-0">
        {plan ? (
          <>
            <h2 className="text-base font-bold text-gray-900 mb-2">How it works</h2>
            <ol className="text-sm text-gray-500 leading-relaxed space-y-2 list-decimal list-inside">
              <li>Submit this form with your contact details</li>
              <li>Our team reviews your request within 24 hours</li>
              <li>We confirm payment details via your mobile / email</li>
              <li>Your membership is activated immediately after payment</li>
            </ol>
          </>
        ) : (
          <>
            <h2 className="text-base font-bold text-gray-900 mb-2">Issue with your booking?</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Open the PassPrivé app → Go to your profile → Tap &lsquo;Chat with us&rsquo; under the Support section to connect with our customer support team for faster assistance.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
