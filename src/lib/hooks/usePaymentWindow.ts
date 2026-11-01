'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { resolveGatewayUrl, submitGatewayForm } from '@/lib/utils/payment'

const WINDOW = 'pp_bank_payment'
const PAID = ['VERIFIED_SUCCESS', 'FINALIZED']
const FAILED = ['VERIFIED_FAILED', 'FAILED']

export type PaymentSession = { sessionId: string; merchantTrace: string }
export type PaymentEnd = PaymentSession & { outcome: '' | 'success' | 'failed' }

/**
 * The bank's card page in its own window, followed from here — app parity:
 * PaymentProcessingScreen + waitForMipsPayment (payment_sessions.status every
 * 2.5s). The gateway can end on its own "Payment Completed" page instead of
 * returning to the site, so the page that opened it moves on by itself: when
 * the session is paid or failed, or the window is closed, `onEnd` runs (and the
 * caller's return page verifies it for real).
 *
 * `open()` must run inside the click (pop-up blockers); `launch()` then sends
 * the gateway into that window — or this tab when there is no window.
 */
export function usePaymentWindow(onEnd: (end: PaymentEnd) => void) {
  const popupRef = useRef<Window | null>(null)
  const [waiting, setWaiting] = useState<PaymentSession | null>(null)
  const onEndRef = useRef(onEnd)
  useEffect(() => { onEndRef.current = onEnd }, [onEnd])

  const open = useCallback(() => {
    const popup = window.open('', WINDOW, 'popup,width=520,height=780')
    if (popup) {
      popup.document.title = 'PassPrivé — secure payment'
      popup.document.body.innerHTML = '<p style="font:16px system-ui;color:#5b5a5a;text-align:center;margin-top:40vh">Opening your bank’s secure page…</p>'
    }
    popupRef.current = popup
    return popup
  }, [])

  const close = useCallback(() => {
    try { popupRef.current?.close() } catch { /* ignore */ }
  }, [])

  /** Send the gateway from an initiate response; true when it opened in the window. */
  const launch = useCallback((data: Record<string, unknown>, session: PaymentSession) => {
    const gateway = (data.gateway ?? null) as { url?: string; fields?: Record<string, string> } | null
    const fields = gateway?.fields ?? ((data.form_fields ?? data.fields ?? null) as Record<string, string> | null)
    const url = gateway?.url || resolveGatewayUrl(data)
    if (!url) throw new Error('No payment page was returned. Please try again.')
    const hasForm = !!fields && Object.keys(fields).length > 0
    const popup = popupRef.current
    if (popup && !popup.closed) {
      if (hasForm) submitGatewayForm(url, fields!, WINDOW)
      else popup.location.href = url
      popup.focus()
      setWaiting(session)
      return true
    }
    if (hasForm) submitGatewayForm(url, fields!)
    else window.location.href = url
    return false
  }, [])

  useEffect(() => {
    if (!waiting) return
    let live = true
    let timer: ReturnType<typeof setTimeout>
    const started = Date.now()
    const end = (outcome: PaymentEnd['outcome']) => {
      close()
      onEndRef.current({ ...waiting, outcome })
    }
    const tick = async () => {
      const status = await fetch(`/api/pay-bill/status?session_id=${encodeURIComponent(waiting.sessionId)}`, { cache: 'no-store' })
        .then(res => res.json() as Promise<{ status?: string }>)
        .then(d => String(d.status ?? ''))
        .catch(() => '')
      if (!live) return
      if (PAID.includes(status)) return end('success')
      if (FAILED.includes(status)) return end('failed')
      if (popupRef.current?.closed || Date.now() - started > 15 * 60 * 1000) return end('')
      timer = setTimeout(tick, 2500)
    }
    timer = setTimeout(tick, 2500)
    return () => { live = false; clearTimeout(timer) }
  }, [waiting, close])

  /** Stop waiting — still ends through the return page, which says whether anything was charged. */
  const cancel = useCallback(() => {
    if (!waiting) return
    close()
    onEndRef.current({ ...waiting, outcome: '' })
  }, [waiting, close])

  return { waiting, open, close, launch, cancel, focus: () => popupRef.current?.focus() }
}
