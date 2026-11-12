'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Loader2, SendHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Live support chat — app parity: screens/SupportChatScreen.jsx +
 * utils/supportChatApi.js. "Lona" (AI) answers first; a confirmed handoff
 * moves the chat to a live agent. The app listens to `chat_messages` over
 * Supabase realtime; the browser has no readable session for that, so while an
 * agent has the chat it re-reads the conversation every few seconds instead.
 */

const STATUS = { OPEN: 'OPEN', HANDOFF_REQUESTED: 'HANDOFF_REQUESTED', HANDED_OFF: 'HANDED_OFF', RESOLVED: 'RESOLVED', CLOSED: 'CLOSED' } as const
const ASSISTANT_NAME = 'Lona'
const BOOKING_OPTIONS_PAGE_SIZE = 3
const GUEST_ID_KEY = 'support_chat_guest_identifier'
const AGENT_POLL_MS = 4000

type Msg = { id: string; role: string; message: string; created_at: string; pending?: boolean; failed?: boolean }
type BookingOption = { id: string; title: string; statusLabel: string; bookingRef: string }
type ChatResponse = { chat_id?: string; status?: string; ai_enabled?: boolean; ai_disabled?: boolean; handoff_requested?: boolean; response?: string; messages?: unknown[]; conversation?: { status?: string } }

const aiEnabledFor = (status: string) => status === STATUS.OPEN || status === STATUS.HANDOFF_REQUESTED

class ChatError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

async function call(path: string, init?: RequestInit): Promise<ChatResponse> {
  const res = await fetch(`/api/support-chat/${path}`, { ...init, headers: { 'Content-Type': 'application/json' }, cache: 'no-store' })
  const data = (await res.json().catch(() => null)) as (ChatResponse & { error?: string; message?: string }) | null
  if (!res.ok) throw new ChatError(data?.error || data?.message || `Request failed (${res.status})`, res.status)
  return data ?? {}
}

function guestIdentifier(signedIn: boolean) {
  if (signedIn) return ''
  try {
    const existing = localStorage.getItem(GUEST_ID_KEY)?.trim()
    if (existing) return existing
    const next = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(GUEST_ID_KEY, next)
    return next
  } catch {
    return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  }
}

function normalize(list: unknown[] = []): Msg[] {
  const seen = new Set<string>()
  return list
    .map((raw, i) => {
      const item = (raw ?? {}) as Record<string, unknown>
      return {
        id: String(item.id || `m_${i}_${item.created_at || ''}`),
        role: String(item.role || 'assistant'),
        message: String(item.message || '').trim(),
        created_at: String(item.created_at || new Date().toISOString()),
      }
    })
    .filter(m => m.message && !seen.has(m.id) && seen.add(m.id))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

const sameMessage = (a: Msg, b: Msg) =>
  a.role === b.role && a.message.trim() === b.message.trim() &&
  Math.abs(new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) <= 15000

/** server transcript + any local messages it hasn't echoed yet */
function merge(server: Msg[], local: Msg[]) {
  const extra = local.filter(l => (l.pending || l.failed) && !server.some(s => sameMessage(s, l) || (l.role === 'user' && s.role === 'user' && s.message.trim() === l.message.trim())))
  return [...server, ...extra].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

function assistantReply(resp: ChatResponse, confirmHandoff: boolean) {
  const handedOff = resp.status === STATUS.HANDED_OFF || resp.status === STATUS.RESOLVED || resp.status === STATUS.CLOSED || !!resp.ai_disabled
  if (confirmHandoff || handedOff) return 'Connecting you to a live agent now.'
  if (resp.handoff_requested) return 'Could you please confirm: do you want to connect with an agent?'
  return String(resp.response || '').trim()
}

const dayKey = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
function dayLabel(iso: string) {
  const d = new Date(iso)
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  if (dayKey(iso) === dayKey(new Date().toISOString())) return 'Today'
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
const time12 = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

export function SupportChat({ user }: { user: { firstName: string; fullName: string; email: string; phone: string } | null }) {
  const [initializing, setInitializing] = useState(true)
  const [chatId, setChatId] = useState('')
  const [guestId, setGuestId] = useState('')
  const [status, setStatus] = useState<string>(STATUS.OPEN)
  const [handoffRequested, setHandoffRequested] = useState(false)
  const [aiDisabled, setAiDisabled] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [promptDismissed, setPromptDismissed] = useState(false)
  const [options, setOptions] = useState<BookingOption[]>([])
  const [optionsLimit, setOptionsLimit] = useState(BOOKING_OPTIONS_PAGE_SIZE)
  const [optionsLoadedFor, setOptionsLoadedFor] = useState<number | null>(null)
  const [optionsHasMore, setOptionsHasMore] = useState(false)
  const [welcomeAt, setWelcomeAt] = useState(() => new Date().toISOString())
  const listRef = useRef<HTMLDivElement>(null)
  const inFlight = useRef(false)
  const handoffNoticeShown = useRef(false)

  const loadTranscript = useCallback(async (id: string, guest: string) => {
    if (!id) return
    try {
      const q = guest ? `?guest_identifier=${encodeURIComponent(guest)}` : ''
      const convo = await call(`conversation/${encodeURIComponent(id)}${q}`)
      const server = normalize(convo.messages ?? [])
      setMessages(prev => merge(server, prev))
      const next = convo.conversation?.status
      if (next) {
        setStatus(next)
        setHandoffRequested(next === STATUS.HANDOFF_REQUESTED)
        setAiDisabled(!aiEnabledFor(next))
        if (aiEnabledFor(next)) handoffNoticeShown.current = false
      }
    } catch (err) {
      if (err instanceof ChatError && err.status === 404) setChatId('')
    }
  }, [])

  // initializing / errorText start fresh; a retry resets them first (see `retry`)
  const setupSession = useCallback(async () => {
    try {
      const guest = guestIdentifier(!!user)
      setGuestId(guest)
      const session = await call('session', {
        method: 'POST',
        body: JSON.stringify({ channel: 'web', metadata: { platform: 'web' }, ...(guest ? { guest_identifier: guest } : {}) }),
      })
      const id = String(session.chat_id || '').trim()
      const nextStatus = session.status || STATUS.OPEN
      setChatId(id)
      setStatus(nextStatus)
      setAiDisabled(session.ai_enabled === false || !aiEnabledFor(nextStatus))
      await loadTranscript(id, guest)
    } catch (err) {
      setErrorText(err instanceof ChatError && (err.status === 401 || err.status === 403)
        ? 'Session expired. Please sign in again to continue.'
        : 'Unable to load support chat.')
    } finally {
      setInitializing(false)
    }
  }, [user, loadTranscript])

  // started from a timer so a dev double-mount doesn't open two sessions
  useEffect(() => {
    const timer = setTimeout(setupSession, 0)
    return () => clearTimeout(timer)
  }, [setupSession])

  const retry = useCallback(() => {
    setInitializing(true)
    setErrorText('')
    setupSession()
  }, [setupSession])

  // live-agent mode: re-read the conversation so the agent's replies show up
  useEffect(() => {
    if (!chatId || !aiDisabled || status === STATUS.CLOSED) return
    const timer = setInterval(() => loadTranscript(chatId, guestId), AGENT_POLL_MS)
    return () => clearInterval(timer)
  }, [chatId, aiDisabled, status, guestId, loadTranscript])

  // opening prompt: the user's own recent bookings (signed-in only, like the app)
  const showBookingPrompt = !initializing && messages.length === 0 && !promptDismissed && status === STATUS.OPEN
  const optionsLoading = showBookingPrompt && !!user && optionsLoadedFor !== optionsLimit
  useEffect(() => {
    if (!showBookingPrompt || !user) return
    let active = true
    fetch(`/api/support-chat/bookings?limit=${optionsLimit}`, { cache: 'no-store' })
      .then(r => r.json())
      .then((d: { options?: BookingOption[]; hasMore?: boolean }) => {
        if (!active) return
        setOptions(d.options ?? [])
        setOptionsHasMore(!!d.hasMore)
      })
      .catch(() => { if (active) { setOptions([]); setOptionsHasMore(false) } })
      .finally(() => { if (active) setOptionsLoadedFor(optionsLimit) })
    return () => { active = false }
  }, [showBookingPrompt, user, optionsLimit])

  const send = useCallback(async (text?: string, confirmHandoff = false) => {
    const messageText = String(text ?? input).trim()
    if (!messageText || !chatId || inFlight.current) return
    const lower = messageText.toLowerCase()
    const affirmative = lower === 'yes' || lower === 'y' || ['connect me', 'connect to agent', 'connect with agent', 'connect to support'].some(p => lower.includes(p))
    const shouldConfirm = confirmHandoff || (handoffRequested && affirmative)

    inFlight.current = true
    setSending(true)
    setErrorText('')
    const localId = `local_${Date.now()}`
    setMessages(prev => [...prev.filter(m => !(m.failed && m.message === messageText)), { id: localId, role: 'user', message: messageText, created_at: new Date().toISOString(), pending: true }])
    setInput('')

    try {
      const resp = await call('message', {
        method: 'POST',
        body: JSON.stringify({
          chat_id: chatId,
          message: messageText,
          channel: 'web',
          confirm_handoff: shouldConfirm,
          metadata: { screen: 'support_chat' },
          ...(guestId ? { guest_identifier: guestId } : {}),
          ...(user ? { user_context: { full_name: user.fullName, phone: user.phone, email: user.email } } : {}),
        }),
      })
      const nextStatus = resp.status || status
      const nextAiDisabled = !!resp.ai_disabled || !aiEnabledFor(nextStatus)
      setStatus(nextStatus)
      setHandoffRequested(!!resp.handoff_requested)
      setAiDisabled(nextAiDisabled)
      setMessages(prev => {
        const confirmed = prev.map(m => (m.id === localId ? { ...m, pending: false } : m))
        // with a live agent, keep the message pending until the transcript echoes it
        if (nextAiDisabled && !shouldConfirm) return prev
        const reply = assistantReply(resp, shouldConfirm)
        if (!reply || (nextAiDisabled && handoffNoticeShown.current)) return confirmed
        if (nextAiDisabled) handoffNoticeShown.current = true
        return [...confirmed, { id: `assistant_${Date.now()}`, role: 'assistant', message: reply, created_at: new Date().toISOString() }]
      })
    } catch (err) {
      setMessages(prev => prev.map(m => (m.id === localId ? { ...m, pending: false, failed: true } : m)))
      const code = err instanceof ChatError ? err.status : 0
      if (code === 404) {
        retry()
      } else {
        setErrorText(code >= 500 ? 'Message failed. Please retry.' : 'Unable to send message right now.')
      }
    } finally {
      inFlight.current = false
      setSending(false)
    }
  }, [chatId, guestId, handoffRequested, input, retry, status, user])

  const quickReply = (text: string) => { setPromptDismissed(true); send(text) }

  const reopen = async () => {
    setMessages([])
    setChatId('')
    setStatus(STATUS.OPEN)
    setPromptDismissed(false)
    setOptionsLimit(BOOKING_OPTIONS_PAGE_SIZE)
    setWelcomeAt(new Date().toISOString())
    retry()
  }

  const closed = status === STATUS.CLOSED
  const items = useMemo(() => {
    const leading: Msg[] = showBookingPrompt
      ? [
          { id: 'welcome-msg', role: 'assistant', message: `Hi ${user?.fullName || 'there'}! Welcome to chat support.`, created_at: welcomeAt },
          { id: 'booking-prompt-msg', role: 'assistant', message: 'Please select the booking you are facing issue with:', created_at: welcomeAt },
        ]
      : []
    const trailing: Msg[] = closed
      ? [{ id: 'closed-msg', role: 'assistant', message: 'The conversation has been closed due to inactivity.', created_at: messages.at(-1)?.created_at || welcomeAt }]
      : []
    let lastDay = ''
    let lastRole = ''
    return [...leading, ...messages, ...trailing].flatMap(m => {
      const out: ({ type: 'divider'; id: string; label: string } | { type: 'msg'; msg: Msg; showLabel: boolean })[] = []
      if (dayKey(m.created_at) !== lastDay) {
        lastDay = dayKey(m.created_at)
        lastRole = ''
        out.push({ type: 'divider', id: `d-${lastDay}`, label: dayLabel(m.created_at) })
      }
      out.push({ type: 'msg', msg: m, showLabel: m.role !== lastRole })
      lastRole = m.role
      return out
    })
  }, [showBookingPrompt, user, welcomeAt, closed, messages])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [items.length, optionsLoading])

  if (initializing) {
    return (
      <div className='flex flex-1 flex-col items-center justify-center gap-2 py-24 text-sm text-[#605D64]'>
        <Loader2 className='h-5 w-5 animate-spin text-brand' />
        Loading support chat...
      </div>
    )
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {errorText && (
        <button type='button' onClick={retry} className='mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-left text-[13px] text-red-600'>
          {errorText} Tap to retry.
        </button>
      )}

      <div ref={listRef} className='min-h-0 flex-1 overflow-y-auto py-4'>
        {items.map(item => {
          if (item.type === 'divider') {
            return <p key={item.id} className='my-3 text-center text-[12px] font-medium text-[#605D64]'>{item.label}</p>
          }
          const { msg } = item
          const isUser = msg.role === 'user'
          const bubble = (
            <div
              className={cn(
                'max-w-[80%] border px-3.5 py-2.5 text-[14px] leading-5 whitespace-pre-wrap text-black',
                isUser
                  ? 'rounded-[16px_4px_16px_16px] border-[#D5D5D5] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'rounded-[4px_16px_16px_16px] border-[rgba(240,90,40,0.15)] bg-[rgba(240,90,40,0.15)]',
                msg.pending && 'opacity-70',
                msg.failed && 'border-red-300',
              )}
            >
              {msg.message}
              {msg.pending ? <p className='mt-1 text-[11px] text-[#605D64]'>Sending...</p>
                : msg.failed ? <p className='mt-1 text-[11px] text-red-600'>Failed. Tap to retry.</p>
                : <p className='mt-1 text-right text-[11px] text-[#605D64]'>{time12(msg.created_at)}</p>}
            </div>
          )
          return (
            <div key={msg.id} className='mb-2'>
              {item.showLabel && (
                <p className={cn('mb-1 text-[11px] font-semibold tracking-wide text-[#605D64] uppercase', isUser ? 'text-right' : 'text-left')}>
                  {isUser ? user?.firstName || 'You' : ASSISTANT_NAME}
                </p>
              )}
              <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
                {msg.failed ? <button type='button' onClick={() => send(msg.message)} className='contents'>{bubble}</button> : bubble}
              </div>
            </div>
          )
        })}

        {showBookingPrompt && (
          <div className='mt-2 overflow-hidden rounded-2xl border border-[#E6E0E9] bg-[#FFFBFF] text-[14px]'>
            {options.map(o => (
              <button key={o.id} type='button' onClick={() => quickReply(`Booking ID-${o.bookingRef} at ${o.title}`)} className='block w-full border-b border-[#E6E0E9] px-4 py-3 text-left hover:bg-[#FAF6FC]'>
                <span className='block font-semibold text-black'>{o.title}</span>
                <span className='block text-[12px] text-[#605D64]'>Status-{o.statusLabel}</span>
                <span className='block text-[12px] text-[#605D64]'>Booking ID-{o.bookingRef}</span>
              </button>
            ))}
            {optionsLoading && <div className='flex justify-center border-b border-[#E6E0E9] py-3'><Loader2 className='h-4 w-4 animate-spin text-brand' /></div>}
            {!optionsLoading && optionsHasMore && (
              <button type='button' onClick={() => setOptionsLimit(l => l + BOOKING_OPTIONS_PAGE_SIZE)} className='block w-full border-b border-[#E6E0E9] px-4 py-3 text-left font-medium hover:bg-[#FAF6FC]'>
                Load more transactions
              </button>
            )}
            <button type='button' onClick={() => quickReply('I need help with a bill payment made at a restaurant')} className='block w-full border-b border-[#E6E0E9] px-4 py-3 text-left font-medium hover:bg-[#FAF6FC]'>
              I need help with a bill payment made at a restaurant
            </button>
            <button type='button' onClick={() => quickReply('I have other query')} className='block w-full px-4 py-3 text-left font-medium hover:bg-[#FAF6FC]'>
              I have other query
            </button>
          </div>
        )}

        {closed && (
          <div className='mx-auto mt-3 flex w-fit items-center gap-2 rounded-full bg-[#E8F5E9] px-3 py-1.5 text-[12px] font-semibold text-[#2E7D32]'>
            <span className='flex h-4 w-4 items-center justify-center rounded-full bg-[#2E7D32]'><Check className='h-2.5 w-2.5 text-white' strokeWidth={3} /></span>
            This conversation has been closed
          </div>
        )}
      </div>

      {closed ? (
        <div className='flex items-center justify-between rounded-2xl border-t border-[#E6E0E9] bg-[#FFF3D6] px-4 py-4'>
          <p className='text-[15px] font-semibold text-black'>Still have an issue ?</p>
          <button type='button' onClick={reopen} className='text-[15px] font-bold text-black underline'>Chat with us</button>
        </div>
      ) : (
        <form
          onSubmit={e => { e.preventDefault(); setPromptDismissed(true); send() }}
          className='flex items-end gap-2 border-t border-[#E6E0E9] bg-white pt-3'
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setPromptDismissed(true); send() } }}
            rows={1}
            placeholder={aiDisabled ? 'Message support team...' : 'Type your message...'}
            className='max-h-32 min-h-11 flex-1 resize-none rounded-3xl border border-[#E6E0E9] px-4 py-2.5 text-[14px] text-black outline-none focus:border-brand'
          />
          <button
            type='submit'
            aria-label='Send'
            disabled={!input.trim() || sending || !chatId}
            className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40'
          >
            {sending ? <Loader2 className='h-5 w-5 animate-spin' /> : <SendHorizontal className='h-5 w-5' />}
          </button>
        </form>
      )}
    </div>
  )
}
