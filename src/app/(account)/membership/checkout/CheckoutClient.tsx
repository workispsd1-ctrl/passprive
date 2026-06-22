'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, CreditCard, Loader2, Check } from 'lucide-react'
import type { SubscriptionPlan } from '@/lib/types/subscription'
import { TIER_PERKS, PLAN_TIER } from '@/lib/types/subscription'

const SESSION_KEY = 'pp_payment_session'

function resolveSessionId(payload: Record<string, unknown>): string {
  const session = (payload?.payment_session ?? payload?.session ?? payload) as Record<string, unknown>
  return String(session?.id ?? session?.session_id ?? payload?.session_id ?? payload?.id ?? '')
}

function resolveMerchantTrace(payload: Record<string, unknown>): string {
  const session = (payload?.payment_session ?? payload?.session ?? payload) as Record<string, unknown>
  return String(session?.merchant_trace ?? session?.merchantTrace ?? payload?.merchant_trace ?? payload?.merchantTrace ?? '')
}

function resolveGatewayUrl(payload: Record<string, unknown>): string {
  const session = (payload?.payment_session ?? payload?.session ?? payload) as Record<string, unknown>
  const candidates = [
    payload?.redirect_url, payload?.redirectUrl, payload?.payment_url, payload?.paymentUrl,
    payload?.hosted_url, payload?.hostedUrl, payload?.launch_url, payload?.launchUrl,
    session?.redirect_url, session?.redirectUrl, session?.payment_url, session?.paymentUrl,
    session?.hosted_url, session?.hostedUrl, session?.launch_url, session?.launchUrl,
    payload?.gateway_url, payload?.gatewayUrl, session?.gateway_url, session?.gatewayUrl,
    payload?.url, session?.url,
  ]
  return String(candidates.find(v => typeof v === 'string' && (v as string).trim()) ?? '')
}

function submitGatewayForm(url: string, fields: Record<string, string>) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = url
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}

interface Props {
  plan: SubscriptionPlan
}

export function CheckoutClient({ plan }: Props) {
  const router = useRouter()
  const tier = PLAN_TIER[plan.product_id] ?? 'premium'
  const perks = TIER_PERKS[tier] ?? []
  const isBlack = tier === 'black'

  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    if (!agreed) {
      setError('Please agree to the membership terms before proceeding.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/payments/membership/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membership_payload: {
            plan_id: plan.id,
            plan_name: plan.plan_name.trim(),
            plan_type: plan.type,
            product_id: plan.product_id,
            price_id: plan.price_id,
            amount: Number(plan.amount),
            currency_code: 'MUR',
          },
        }),
      })

      const data = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((data?.error as string) ?? 'Payment initiation failed')

      const sessionId = resolveSessionId(data)
      const merchantTrace = resolveMerchantTrace(data)
      const gateway = data?.gateway as { url?: string; fields?: Record<string, string> } | undefined

      if (!sessionId) throw new Error('No payment session returned. Please try again.')

      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId, merchantTrace, paymentContext: 'MEMBERSHIP' }))

      if (gateway?.url && gateway?.fields && typeof gateway.fields === 'object') {
        submitGatewayForm(gateway.url, gateway.fields)
        return
      }

      const launchUrl = resolveGatewayUrl(data)
      if (launchUrl) {
        window.location.href = launchUrl
        return
      }

      throw new Error('No payment URL returned by the gateway. Please try again.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pb-12 max-w-md mx-auto">

      {/* Plan summary card */}
      <div className={`mt-5 rounded-3xl text-white p-6 ${isBlack ? 'bg-linear-to-br from-gray-900 to-black' : 'bg-linear-to-br from-violet-600 to-purple-800'}`}>
        <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">Subscribing to</p>
        <p className="text-2xl font-extrabold">{plan.plan_name.trim()}</p>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-4xl font-extrabold">Rs {Number(plan.amount).toLocaleString()}</span>
          <span className="text-sm opacity-60">/ year</span>
        </div>
        <p className="text-sm opacity-70 mt-1">{plan.cashback}% cashback on every bill</p>
      </div>

      {/* What's included */}
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">What's included</p>
        <ul className="flex flex-col gap-2">
          {perks.map(perk => (
            <li key={perk} className="flex items-start gap-2.5 text-sm text-gray-700">
              <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isBlack ? 'text-gray-700' : 'text-violet-500'}`} />
              {perk}
            </li>
          ))}
        </ul>
      </div>

      {/* Payment info */}
      <div className="mt-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-gray-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Credit / Debit Card</p>
          <p className="text-xs text-gray-400 mt-0.5">Visa, Mastercard — secured by iVeri · 3D Secure</p>
        </div>
      </div>

      {/* Consent checkbox */}
      <label className="mt-5 flex items-start gap-3 cursor-pointer">
        <div
          onClick={() => setAgreed(v => !v)}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${agreed ? (isBlack ? 'bg-gray-900 border-gray-900' : 'bg-violet-600 border-violet-600') : 'border-gray-300 bg-white'}`}
        >
          {agreed && <Check className="w-3 h-3 text-white" />}
        </div>
        <span className="text-sm text-gray-600 leading-snug">
          I agree to the PassPrivé <a href="/terms" className="underline text-gray-800" target="_blank" rel="noopener noreferrer">membership terms</a>, billing policy and cancellation policy.
          I understand my membership will be billed annually.
        </span>
      </label>

      {error && (
        <p className="mt-3 text-sm text-red-500 font-medium">{error}</p>
      )}

      {/* Pay button */}
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className={`mt-5 w-full py-4 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 ${isBlack ? 'bg-gray-900 hover:bg-black' : 'bg-violet-600 hover:bg-violet-700'}`}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
        {loading ? 'Redirecting to payment…' : `Pay Rs ${Number(plan.amount).toLocaleString()}`}
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        Secured by iVeri payment gateway. You will be redirected to complete payment.
      </p>

      <button
        type="button"
        onClick={() => router.back()}
        className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
    </div>
  )
}
