'use client'

import { useState } from 'react'
import { Check, Globe, Heart, Navigation, Phone, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSaved } from '@/lib/context/SavedContext'
import { SaveListSheet } from '@/components/SaveListSheet'
import type { SavedEntityType } from '@/lib/services/savedEntities'

/** Web Share sheet where the browser has one, else copy the link. Resolves true when copied. */
export async function shareLink(title: string): Promise<boolean> {
  const url = window.location.href.split('#')[0]
  try {
    if (navigator.share) {
      await navigator.share({ title, url })
      return false
    }
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}

/** Google Maps directions to a merchant — coordinates when known, else the address. */
export function directionsUrl(lat: number | null | undefined, lng: number | null | undefined, address: string) {
  return lat != null && lng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}

/**
 * Heart that saves the merchant and then opens the "save to list" sheet —
 * app parity: the detail hero's heart (RestaurantSaveFlow).
 */
export function useSaveMerchant(id: string, type: SavedEntityType) {
  const { isSaved, toggle, setSaved } = useSaved()
  const [sheetOpen, setSheetOpen] = useState(false)
  const saved = isSaved(id)

  async function onSave() {
    if (!isSaved(id)) {
      const res = await toggle(id, type)
      if (res === null) return // logged out — the login prompt is showing
    }
    setSheetOpen(true)
  }

  function sheet(name: string) {
    return (
      <SaveListSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        entityId={id}
        entityType={type}
        entityName={name}
        onSavedChange={anywhere => setSaved(id, anywhere)}
      />
    )
  }

  return { saved, onSave, sheet }
}

/**
 * One action: an icon in a circle with its label underneath on phones (app
 * parity: the detail screens' circle action icons — all of them fit on one
 * row), a labelled pill from tablet up.
 */
export function ActionItem({
  icon: Icon,
  label,
  href,
  external,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href?: string
  external?: boolean
  onClick?: () => void
  active?: boolean
}) {
  const cls = cn(
    'group flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl text-[11.5px] font-semibold text-gray-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    'md:flex-none md:flex-row md:gap-1.5 md:rounded-full md:border md:border-gray-200 md:px-4 md:py-2 md:text-[13px] md:hover:border-brand md:hover:text-brand',
    active && 'text-brand md:border-brand/40 md:bg-brand-tint',
  )
  const body = (
    <>
      <span
        className={cn(
          'flex size-11 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors group-hover:border-brand group-hover:text-brand md:size-auto md:border-0 md:bg-transparent',
          active && 'border-brand/40 bg-brand-tint',
        )}
      >
        <Icon className={cn('size-4.5 md:size-3.5', active && 'fill-current')} />
      </span>
      <span className='truncate'>{label}</span>
    </>
  )
  if (href) {
    return (
      <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {body}
      </a>
    )
  }
  return (
    <button type='button' onClick={onClick} aria-pressed={active} className={cls}>
      {body}
    </button>
  )
}

/**
 * Direction / Call / Share / Save row under a merchant's name — app parity:
 * the circle action icons on the detail screens.
 */
export function MerchantActions({
  id,
  type,
  name,
  address,
  lat,
  lng,
  phone,
  className,
  children,
}: {
  id: string
  type: SavedEntityType
  name: string
  address: string
  lat?: number | null
  lng?: number | null
  phone?: string | null
  className?: string
  /** extra actions (e.g. Website) kept in the same row — use ActionItem */
  children?: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)
  const { saved, onSave, sheet } = useSaveMerchant(id, type)

  async function onShare() {
    if (await shareLink(name)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={cn('flex items-start gap-1 md:flex-wrap md:items-center md:gap-2', className)}>
      {(address || (lat != null && lng != null)) && (
        <ActionItem icon={Navigation} label='Directions' href={directionsUrl(lat, lng, address || name)} external />
      )}
      {phone && <ActionItem icon={Phone} label='Call' href={`tel:${phone}`} />}
      <ActionItem icon={copied ? Check : Share2} label={copied ? 'Copied' : 'Share'} onClick={onShare} />
      <ActionItem icon={Heart} label={saved ? 'Saved' : 'Save'} onClick={onSave} active={saved} />
      {children}
      {sheet(name)}
    </div>
  )
}

/** "Website" action for server pages — an icon component can't be passed to ActionItem from the server. */
export function WebsiteAction({ href }: { href: string }) {
  return <ActionItem icon={Globe} label='Website' href={href} external />
}
