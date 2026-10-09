'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronDown, ChevronLeft, FolderOpen, Headphones, Info, LayoutGrid, MessageCircle, Search, ShieldCheck, Star, Tag, UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type FaqEntry = { id: string; question: string; answer: string; tags: string[] | string | null }

const ORANGE = '#E8510A'

// app parity: FaqScreen.jsx CATEGORY_META
const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Account: UserCircle,
  Accounts: UserCircle,
  'Reviews and Ratings': Star,
  'Store Offers': Tag,
  Support: Headphones,
  'Safety and Policy': ShieldCheck,
  Additional: FolderOpen,
}
const iconFor = (tag: string) => CATEGORY_ICON[tag] ?? Info

/** app parity: getFirstTag */
function firstTag(tags: FaqEntry['tags']): string {
  if (Array.isArray(tags)) return tags[0] || 'Additional'
  if (typeof tags === 'string') return tags.trim() || 'Additional'
  return 'Additional'
}

function Answer({ text }: { text: string }) {
  return <p className='text-[14px] leading-[22px] whitespace-pre-line text-[#717171]'>{text}</p>
}

export function FaqClient({ faqs }: { faqs: FaqEntry[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [openId, setOpenId] = useState<string | null>(null)
  const [closedSections, setClosedSections] = useState<Set<string>>(new Set())

  const q = search.trim().toLowerCase()
  const matches = (f: FaqEntry) => !q || f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q)

  // app parity: chips in first-seen order, "Additional" last
  const categories = useMemo(() => {
    const seen: string[] = []
    faqs.forEach(f => { const t = firstTag(f.tags); if (!seen.includes(t)) seen.push(t) })
    return ['All', ...seen.filter(t => t !== 'Additional'), ...(seen.includes('Additional') ? ['Additional'] : [])]
  }, [faqs])

  const grouped = useMemo(() => {
    const map = new Map<string, FaqEntry[]>()
    faqs.filter(matches).forEach(f => {
      const t = firstTag(f.tags)
      map.set(t, [...(map.get(t) ?? []), f])
    })
    const entries = [...map.entries()].filter(([k]) => k !== 'Additional')
    if (map.has('Additional')) entries.push(['Additional', map.get('Additional')!])
    return entries
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faqs, q])

  const flat = category === 'All' ? [] : faqs.filter(f => firstTag(f.tags) === category && matches(f))
  const empty = category === 'All' ? grouped.length === 0 : flat.length === 0
  const toggle = (id: string) => setOpenId(cur => (cur === id ? null : id))

  return (
    <main className='min-h-screen bg-[#F8F8F8] pb-16 font-(family-name:--font-dm-sans)'>
      {/* Header + search + chips — app parity */}
      <div className='border-b border-[#EFEFEF] bg-white'>
        <div className='mx-auto max-w-3xl px-4 pt-6 pb-4'>
          <div className='flex items-center gap-3.5'>
            <button
              type='button'
              aria-label='Back'
              onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
              className='flex h-9 w-9 items-center justify-center rounded-full bg-black/5 hover:bg-black/10'
            >
              <ChevronLeft className='h-6 w-6 text-[#1C1C1E]' />
            </button>
            <h1 className='text-[18px] font-bold text-[#1C1C1E] md:text-[22px]'>PassPrivé FAQs</h1>
          </div>

          <label className='mt-4 flex h-11 items-center gap-2 rounded-xl bg-[#F0F0F0] px-3.5'>
            <Search className='h-4 w-4 text-[#717171]' />
            <input
              type='search'
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search FAQs...'
              className='h-full flex-1 bg-transparent text-[14px] text-[#1C1C1E] outline-none placeholder:text-[#717171]'
            />
          </label>

          <div className='scrollbar-hide mt-3 -mx-4 flex gap-2 overflow-x-auto px-4'>
            {categories.map(c => {
              const Icon = c === 'All' ? LayoutGrid : iconFor(c)
              const active = c === category
              return (
                <button
                  key={c}
                  type='button'
                  onClick={() => { setCategory(c); setOpenId(null) }}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                    active ? 'text-white' : 'border border-[#EFEFEF] text-[#717171] hover:border-gray-300',
                  )}
                  style={active ? { backgroundColor: ORANGE } : undefined}
                >
                  <Icon className='h-3.5 w-3.5' />
                  {c}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-3xl space-y-3 px-4 pt-5'>
        {empty ? (
          <div className='flex flex-col items-center gap-2 py-16 text-center'>
            <Info className='h-10 w-10 text-[#717171]' strokeWidth={1.5} />
            <p className='text-[14px] text-[#717171]'>{search ? 'Try a different search term.' : 'No FAQs in this category yet.'}</p>
          </div>
        ) : category === 'All' ? (
          // grouped, collapsible sections — app parity: FaqSection / FaqRow
          grouped.map(([cat, items]) => {
            const open = !closedSections.has(cat)
            return (
              <section key={cat} className='overflow-hidden rounded-2xl border border-[#EFEFEF] bg-white'>
                <button
                  type='button'
                  onClick={() => setClosedSections(s => { const n = new Set(s); if (n.has(cat)) n.delete(cat); else n.add(cat); return n })}
                  className='flex w-full items-center justify-between px-4 py-3.5'
                >
                  <span className='text-[15px] font-bold' style={{ color: ORANGE }}>{cat}</span>
                  <ChevronDown className={cn('h-4.5 w-4.5 text-[#717171] transition-transform', open && 'rotate-180')} />
                </button>
                {open && (
                  <div className='divide-y divide-[#EFEFEF] border-t border-[#EFEFEF]'>
                    {items.map(f => (
                      <div key={f.id} className='px-4'>
                        <button type='button' onClick={() => toggle(f.id)} aria-expanded={openId === f.id} className='flex w-full items-start justify-between gap-3 py-3.5 text-left'>
                          <span className='text-[14px] font-semibold text-[#1C1C1E]'>{f.question}</span>
                          <ChevronDown className={cn('mt-0.5 h-4.5 w-4.5 shrink-0 text-[#717171] transition-transform', openId === f.id && 'rotate-180')} />
                        </button>
                        {openId === f.id && <div className='pb-4'><Answer text={f.answer} /></div>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })
        ) : (
          // flat cards — app parity: FaqCard
          flat.map(f => {
            const tag = firstTag(f.tags)
            const Icon = iconFor(tag)
            const open = openId === f.id
            return (
              <div key={f.id} className='rounded-2xl border border-[#EFEFEF] bg-white'>
                <button type='button' onClick={() => toggle(f.id)} aria-expanded={open} className='w-full px-4 pt-3.5 pb-3 text-left'>
                  <span className='flex items-center justify-between'>
                    <span className='inline-flex items-center gap-1 rounded-full bg-[#F5F5F5] px-2 py-0.5 text-[11px] font-semibold text-[#555555]'>
                      <Icon className='h-3 w-3' /> {tag}
                    </span>
                    <ChevronDown className={cn('h-4.5 w-4.5 text-[#717171] transition-transform', open && 'rotate-180')} />
                  </span>
                  <span className='mt-2 block text-[15px] font-semibold text-[#1C1C1E]'>{f.question}</span>
                </button>
                {open && <div className='border-t border-[#EFEFEF] px-4 py-3.5'><Answer text={f.answer} /></div>}
              </div>
            )
          })
        )}

        {/* app parity: "Chat with us" footer */}
        <Link href='/support' className='mt-6 flex items-center justify-between rounded-2xl border border-[#EFEFEF] bg-white px-5 py-4 hover:bg-gray-50'>
          <span>
            <span className='block text-[14px] font-semibold text-[#1C1C1E]'>Still have questions?</span>
            <span className='text-[13px] text-[#717171]'>Our team is here to help</span>
          </span>
          <span className='flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white' style={{ backgroundColor: ORANGE }}>
            <MessageCircle className='h-4 w-4' /> Chat with us
          </span>
        </Link>
      </div>
    </main>
  )
}
