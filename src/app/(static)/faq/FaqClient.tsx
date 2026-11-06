'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ChevronDown, ChevronLeft, Headphones, Info, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FaqEntry = { id: string; question: string; answer: string; tags: string[] | string | null }

/** app parity: FaqScreen.jsx getFirstTag */
function firstTag(tags: FaqEntry['tags']): string {
  if (Array.isArray(tags)) return tags[0] || 'Additional'
  if (typeof tags === 'string') return tags.trim() || 'Additional'
  return 'Additional'
}

/*
 * Built from the Figma frame "check-faqs-screen" (1920px wide). Sizes are
 * `calc(var(--u)*N)` with N = the Figma px value:
 *   --s = page width / 1920 — pure proportional, used for the side margins.
 *   --u = same, but never below 0.8px (reached at ~1536px) on md+, so body
 *         text stays readable on laptops/tablets; 1px on phones, where the
 *         Figma sizes (14–20px text) already suit a small screen.
 */
export function FaqClient({ faqs }: { faqs: FaqEntry[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [chip, setChip] = useState<string | null>(null)
  const [closedSections, setClosedSections] = useState<Set<string>>(new Set())
  const [closedItems, setClosedItems] = useState<Set<string>>(new Set())

  const q = search.trim().toLowerCase()

  // app parity: FaqScreen.jsx — chips are the first tags in first-seen order, "Additional" last
  const categories = useMemo(() => {
    const seen: string[] = []
    faqs.forEach(f => { const t = firstTag(f.tags); if (!seen.includes(t)) seen.push(t) })
    return [...seen.filter(t => t !== 'Additional'), ...(seen.includes('Additional') ? ['Additional'] : [])]
  }, [faqs])

  // grouped by first tag, filtered by chip + search; empty groups dropped
  const sections = useMemo(() => {
    const map = new Map<string, FaqEntry[]>()
    faqs
      .filter(f => !q || f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q))
      .forEach(f => {
        const t = firstTag(f.tags)
        map.set(t, [...(map.get(t) ?? []), f])
      })
    return categories
      .filter(c => (!chip || c === chip) && map.has(c))
      .map(c => ({ id: c, title: c, items: map.get(c)! }))
  }, [faqs, categories, chip, q])

  const toggleIn = (set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) =>
    set(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <main className='@container min-h-screen bg-white font-(family-name:--font-dm-sans) [--s:calc(100cqw/1920)] [--u:1px] md:[--u:max(100cqw/1920,0.8px)]'>
      <div className='px-[max(calc(var(--s)*172),16px)] pt-[calc(var(--u)*80)] pb-[calc(var(--u)*120)]'>
        {/* page-header — back button 44 at x=172, title column at x=241 */}
        <div className='flex items-start gap-[calc(var(--u)*25)]'>
          <button
            type='button'
            aria-label='Back'
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
            className='mt-[calc(var(--u)*3)] flex size-[calc(var(--u)*44)] shrink-0 items-center justify-center rounded-full bg-[rgba(217,217,217,0.102)] hover:bg-[rgba(217,217,217,0.3)]'
          >
            <ChevronLeft className='size-[calc(var(--u)*20)] text-[#1A1A1A]' />
          </button>
          <div className='flex min-w-0 flex-col gap-[calc(var(--u)*16)]'>
            <h1 className='text-[28px] leading-[36px] font-bold text-[#1A1A1A] md:text-[length:calc(var(--u)*48)] md:leading-[calc(var(--u)*62)]'>
              PassPrivé FAQs
            </h1>
            <p className='text-[length:calc(var(--u)*18)] leading-[calc(var(--u)*23)] text-[#4A4A4A]'>
              Find answers to your questions about getting started, membership, rewards, payments, and more.
            </p>
          </div>
        </div>

        {/* search-and-filters */}
        <div className='mt-[calc(var(--u)*64)] flex flex-col gap-[calc(var(--u)*24)]'>
          <label className='flex h-[calc(var(--u)*56)] items-center gap-[calc(var(--u)*12)] rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-[calc(var(--u)*24)]'>
            <Search className='size-[calc(var(--u)*24)] shrink-0 text-[#9CA3AF]' />
            <input
              type='search'
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Search FAQs...'
              className='h-full min-w-0 flex-1 bg-transparent text-[length:calc(var(--u)*16)] leading-[calc(var(--u)*21)] text-[#1A1A1A] outline-none placeholder:text-[#9CA3AF]'
            />
          </label>

          <div className='scrollbar-hide flex gap-[calc(var(--u)*12)] overflow-x-auto'>
            {[null, ...categories].map(c => {
              const active = c === chip
              return (
                <button
                  key={c ?? 'All'}
                  type='button'
                  onClick={() => setChip(c)}
                  className={cn(
                    'h-[calc(var(--u)*38)] shrink-0 rounded-full border px-[calc(var(--u)*20)] text-[length:calc(var(--u)*14)] leading-[calc(var(--u)*18)] whitespace-nowrap transition-colors',
                    active
                      ? 'border-[#FF4800] bg-[#FF4800] font-semibold text-white'
                      : 'border-[#E5E7EB] bg-white font-medium text-[#454040] hover:border-gray-300',
                  )}
                >
                  {c ?? 'All'}
                </button>
              )
            })}
          </div>
        </div>

        {/* faq-sections */}
        <div className='mt-[calc(var(--u)*64)] flex flex-col gap-[calc(var(--u)*48)]'>
          {sections.length === 0 ? (
            <div className='flex flex-col items-center gap-2 py-16 text-center'>
              <Info className='h-10 w-10 text-[#9CA3AF]' strokeWidth={1.5} />
              <p className='text-[14px] text-[#4A4A4A]'>{search ? 'Try a different search term.' : 'No FAQs yet.'}</p>
            </div>
          ) : (
            sections.map(s => {
              const open = !closedSections.has(s.id)
              return (
                <section key={s.id} className='flex flex-col gap-[calc(var(--u)*24)]'>
                  <button
                    type='button'
                    onClick={() => toggleIn(setClosedSections, s.id)}
                    aria-expanded={open}
                    className='flex w-full items-center justify-between rounded-[calc(var(--u)*16)] bg-[#F0F7F4] px-[calc(var(--u)*24)] py-[calc(var(--u)*16)]'
                  >
                    <span className='text-[length:calc(var(--u)*20)] leading-[calc(var(--u)*26)] font-bold text-[#1D6E45]'>{s.title}</span>
                    <ChevronDown className={cn('size-[calc(var(--u)*24)] text-[#1D6E45] transition-transform', open && 'rotate-180')} />
                  </button>

                  {open && (
                    <div className='flex flex-col gap-[calc(var(--u)*16)]'>
                      {s.items.map(f => {
                        const itemOpen = !closedItems.has(f.id)
                        return (
                          <div key={f.id} className='rounded-[calc(var(--u)*12)] border border-[#E5E7EB] bg-white'>
                            <button
                              type='button'
                              onClick={() => toggleIn(setClosedItems, f.id)}
                              aria-expanded={itemOpen}
                              className='flex w-full items-start justify-between gap-[calc(var(--u)*12)] p-[calc(var(--u)*24)] text-left'
                            >
                              <span className='text-[length:calc(var(--u)*16)] leading-[calc(var(--u)*21)] font-bold text-[#1A1A1A]'>{f.question}</span>
                              <ChevronDown className={cn('size-[calc(var(--u)*20)] shrink-0 text-[#1A1A1A] transition-transform', itemOpen && 'rotate-180')} />
                            </button>
                            {itemOpen && (
                              <p className='-mt-[calc(var(--u)*12)] px-[calc(var(--u)*24)] pb-[calc(var(--u)*24)] text-[length:calc(var(--u)*14)] leading-[calc(var(--u)*22)] whitespace-pre-line text-[#4A4A4A]'>
                                {f.answer}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })
          )}
        </div>

        {/* support-banner */}
        <div className='mt-[calc(var(--u)*64)] flex flex-col items-center gap-[calc(var(--u)*32)] rounded-[calc(var(--u)*24)] bg-[#FFF1CF] p-[calc(var(--u)*48)] text-center'>
          <span className='flex size-[calc(var(--u)*64)] items-center justify-center rounded-full bg-[#F05A28]'>
            <Headphones className='size-[calc(var(--u)*32)] text-white' strokeWidth={2} />
          </span>
          <div className='flex flex-col items-center gap-[calc(var(--u)*8)]'>
            <h2 className='text-[length:calc(var(--u)*28)] leading-[calc(var(--u)*36)] font-bold text-[#252525]'>Still need help?</h2>
            <p className='text-[length:calc(var(--u)*18)] leading-[calc(var(--u)*23)] text-[#4A4A4A]'>Our support team is here for you</p>
          </div>
          <Link
            href='/support'
            className='inline-flex h-[calc(var(--u)*48)] items-center justify-center gap-[calc(var(--u)*12)] rounded-full bg-[#F05A28] px-[calc(var(--u)*16)] text-[length:calc(var(--u)*16)] leading-[calc(var(--u)*24)] font-semibold tracking-[0.15px] text-white hover:opacity-90'
          >
            Chat with us <ArrowRight className='size-[calc(var(--u)*18)]' strokeWidth={2} />
          </Link>
        </div>
      </div>
    </main>
  )
}
