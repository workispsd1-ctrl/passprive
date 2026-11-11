'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { isUnlimitedQuota, resetLabel, type DealQuota } from '@/lib/deals'
import type { MerchantDealsState } from '@/lib/services/merchantDeals'
import { DealQuotaDialog } from './DealSheets'

const SWEEP = 270
const MAX_SEGMENTS = 30
const FROM = [176, 140, 235]
const TO = [56, 16, 124]

const litColor = (t: number) => `rgb(${FROM.map((v, i) => Math.round(v + (TO[i] - v) * t)).join(',')})`

/** app parity: DealQuotaGauge.jsx gaugeState */
function gaugeState(quota: DealQuota) {
  const used = Math.max(0, Number(quota.monthly_used) || 0)
  if (isUnlimitedQuota(quota)) {
    const segments = Math.min(MAX_SEGMENTS, Math.max(12, used + 4))
    return { segments, lit: Math.min(used, segments), value: `${used}/∞` }
  }
  const limit = Math.max(0, Number(quota.monthly_limit) || 0)
  const segments = Math.min(MAX_SEGMENTS, Math.max(1, limit))
  const lit = limit > 0 ? Math.round((Math.min(used, limit) / limit) * segments) : 0
  return { segments, lit, value: `${Math.min(used, limit)}/${limit}` }
}

/**
 * The monthly deal-unlocks dial on the title card — app parity:
 * components/DealQuotaGauge.jsx (in MerchantInfoCard). Drawn on a 100-unit
 * box so it scales with `className`; opens the plan's unlocks sheet.
 * Hidden until the visitor has a quota (signed out, or no deals here).
 */
export function DealQuotaGauge({ restaurantId, storeId, className }: { restaurantId?: string; storeId?: string; className?: string }) {
  const [quota, setQuota] = useState<DealQuota | null>(null)
  const [open, setOpen] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/deals/merchant?${restaurantId ? `restaurantId=${restaurantId}` : `storeId=${storeId}`}`)
      .then(res => (res.ok ? res.json() : null))
      .then((data: MerchantDealsState | null) => setQuota(data?.items.length ? data.quota : null))
      .catch(() => {})
  }, [restaurantId, storeId])

  useEffect(() => {
    load()
    const onUsed = (e: Event) => {
      const used = (e as CustomEvent<number>).detail
      setQuota(q => (q ? { ...q, monthly_used: used } : q))
    }
    window.addEventListener('pp:auth', load)
    window.addEventListener('pp:deal-quota', onUsed)
    return () => {
      window.removeEventListener('pp:auth', load)
      window.removeEventListener('pp:deal-quota', onUsed)
    }
  }, [load])

  if (!quota) return null
  const { segments, lit, value } = gaugeState(quota)
  const reset = resetLabel(quota.period_end)
  const c = 50
  const boxH = 15
  const r = c - boxH / 2
  const step = SWEEP / segments
  const boxW = Math.max(2, ((2 * Math.PI * r * (SWEEP / 360)) / segments) * 0.62)
  const valueSize = value.length > 4 ? 14 : value.length > 3 ? 16 : 21

  return (
    <>
      <button
        type='button'
        onClick={() => setOpen(true)}
        aria-label={`${value} deal unlocks redeemed this month`}
        className={cn('flex shrink-0 flex-col items-center font-(family-name:--font-dm-sans)', className)}
      >
        <svg viewBox='0 0 100 100' className='aspect-square w-full' aria-hidden='true'>
          <circle cx={c} cy={c} r={c - boxH - 6} fill='#F3EEFB' />
          {Array.from({ length: segments }, (_, i) => (
            <rect
              key={i}
              x={c - boxW / 2}
              y={0}
              width={boxW}
              height={boxH}
              rx={boxW * 0.3}
              fill={i < lit ? litColor(segments > 1 ? i / (segments - 1) : 1) : '#ECE9EE'}
              transform={`rotate(${-SWEEP / 2 + step * (i + 0.5)} ${c} ${c})`}
            />
          ))}
          <text x={c} y={c + 2} textAnchor='middle' fill='#0F172A' fontSize={valueSize} fontWeight='700' stroke='#0F172A' strokeWidth={valueSize * 0.05}>
            {value}
          </text>
          <text x={c} y={c + 15} textAnchor='middle' fill='#555555' fontSize='12' fontWeight='700'>unlocks</text>
        </svg>
        {reset && <span className='mt-[0.4em] text-[0.9em] font-bold whitespace-nowrap text-[#38107C]'>{reset}</span>}
      </button>
      <DealQuotaDialog open={open} reason='' quota={quota} onClose={() => setOpen(false)} />
    </>
  )
}
