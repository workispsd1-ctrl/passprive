import Image from 'next/image'
import { CHIP_ASPECT, type CardChipKey } from '@/lib/cardChips'
import { cn } from '@/lib/utils'

const LABEL: Record<CardChipKey, string> = {
  recommended: 'Recommended',
  trending: 'Trending',
  'highly-rated': 'Highly rated',
  'stamp-sheet': 'Stamp sheet',
  'instant-booking': 'Instant booking',
  'best-value': 'Best value',
  'most-saved': 'Most saved',
}

/**
 * app parity: CardChips.jsx — the chip artwork in a row, 21px tall (6px apart).
 * `height` takes any CSS length, so design-unit pages can pass calc(…var(--u)).
 */
export function CardChips({ chips, height = '21px', className }: { chips: CardChipKey[]; height?: string; className?: string }) {
  if (!chips.length) return null
  return (
    <span className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {chips.map(key => (
        <Image
          key={key}
          src={`/assets/chips/${key}.webp`}
          alt={LABEL[key]}
          width={Math.round(84 * CHIP_ASPECT[key])}
          height={84}
          className='w-auto shrink-0'
          style={{ height, aspectRatio: CHIP_ASPECT[key] }}
        />
      ))}
    </span>
  )
}
