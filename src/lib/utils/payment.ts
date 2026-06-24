
// The iVeri API response shape varies — these helpers normalise the key names.

export function resolveSessionId(payload: Record<string, unknown>): string {
  const session = (payload?.payment_session ?? payload?.session ?? payload) as Record<string, unknown>
  return String(session?.id ?? session?.session_id ?? payload?.session_id ?? payload?.id ?? '')
}

export function resolveMerchantTrace(payload: Record<string, unknown>): string {
  const session = (payload?.payment_session ?? payload?.session ?? payload) as Record<string, unknown>
  return String(session?.merchant_trace ?? session?.merchantTrace ?? payload?.merchant_trace ?? payload?.merchantTrace ?? '')
}

export function resolveGatewayUrl(payload: Record<string, unknown>): string {
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

// Browser-only — submits a hidden POST form to redirect to the iVeri hosted page.
export function submitGatewayForm(url: string, fields: Record<string, string>) {
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

// ── Payment status classification ─────────────────────────────────────────────

export function classifyPaymentResponse(data: Record<string, unknown>): 'success' | 'pending' | 'failure' {
  if (data?.verified === true) return 'success'
  const status = String(
    data?.status ?? data?.payment_status ?? data?.transaction_status ??
    data?.outcome ?? data?.inferred_outcome ?? data?.result ?? ''
  ).toLowerCase()
  const SUCCESS_STATUSES = ['success', 'approved', 'completed', 'authorized', 'finalized', 'paid', 'verified_success']
  if (SUCCESS_STATUSES.includes(status)) return 'success'
  if (String(data?.gateway_status) === '0') return 'success'
  if (String(data?.result_description ?? '').toLowerCase() === 'approved') return 'success'
  if (['pending', 'processing', 'in_progress'].includes(status)) return 'pending'
  const authCode = data?.authorization_code ?? data?.auth_code ?? data?.authCode
  if (authCode && !['failed', 'declined', 'error', 'cancelled'].includes(status)) return 'success'
  if (['failed', 'declined', 'error', 'cancelled'].includes(status)) return 'failure'
  if (!status) return 'pending'
  return 'failure'
}

export function isPaymentSuccess(data: Record<string, unknown>): boolean {
  return classifyPaymentResponse(data) === 'success'
}
