'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  variant?: 'hero' | 'desktop-full';
  /** desktop header: Figma 1920 sizes (784 × 64 pill) in the header's --u unit */
  scaled?: boolean;
}

// Scaled (desktop header) pill: 64 tall, 728 inner row → 28 side padding, gap 24.
const SCALED_BAR = 'h-[calc(var(--u)*64)] gap-[calc(var(--u)*24)] px-[calc(var(--u)*28)]';
const SCALED_ICON = 'h-[calc(var(--u)*38)] w-[calc(var(--u)*38)]';
const SCALED_DIVIDER = 'h-[calc(var(--u)*28)]';
const SCALED_TEXT = 'text-[length:calc(var(--u)*20)] leading-[calc(var(--u)*20)]';

/**
 * Header search pill. App parity: tapping search opens the full GlobalSearch
 * screen, so the pill is a link to /search (which has its own input, tabs and
 * discovery sections) rather than an inline typeahead.
 */
export function SearchBar({ variant = 'hero', scaled = false }: Props) {
  const hero = variant === 'hero';
  return (
    <Link
      href='/search'
      aria-label='Search'
      className={cn(
        'flex w-full items-center rounded-full',
        hero ? 'bg-white shadow-[0px_4px_4px_0px_rgba(223,94,43,1)]' : 'bg-[#F6F4F4]',
        scaled
          ? SCALED_BAR
          : hero
            ? 'h-12 gap-3 px-5 2xl:h-16 2xl:px-6'
            : 'h-10 gap-2 px-4 2xl:h-12 2xl:px-5 min-[120rem]:h-16 min-[120rem]:gap-3 min-[120rem]:px-7',
      )}
    >
      <Search
        className={cn(
          'shrink-0 text-brand-light',
          scaled ? SCALED_ICON : hero ? 'h-5 w-5 2xl:h-7 2xl:w-7' : 'h-4.5 w-4.5 2xl:h-5 2xl:w-5 min-[120rem]:h-7 min-[120rem]:w-7',
        )}
        strokeWidth={scaled ? 1.5 : 2}
        aria-hidden='true'
      />
      <span
        className={cn('w-px shrink-0 bg-[#E4E4E4]', scaled ? SCALED_DIVIDER : hero ? 'h-6 2xl:h-7' : 'h-5 2xl:h-6 min-[120rem]:h-7')}
        aria-hidden='true'
      />
      <span
        className={cn(
          'min-w-0 flex-1 truncate font-(family-name:--font-dm-sans) font-normal tracking-normal text-[#0D141C]',
          scaled ? SCALED_TEXT : hero ? 'text-[15px] leading-5 2xl:text-[20px]' : 'text-[13px] leading-5 2xl:text-[15px] min-[120rem]:text-[20px]',
        )}
      >
        Search for “Sneakers” around you
      </span>
    </Link>
  );
}
