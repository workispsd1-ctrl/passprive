import { cn } from '@/lib/utils'

/**
 * Design unit for global search (Figma "Search - Website", 1920-wide frames).
 * Desktop classes are the exact Figma values in design px: `--u` is 1px on a
 * 1920 screen and proportional on every other desktop width (100vw / 1920);
 * `--spacing` follows it, so `px-172`, `h-56`, `gap-24` are design px.
 * Below lg `--u` stays 1px and the `max-lg:` classes give the phone layout.
 */
export const SEARCH_UNIT = '[--u:1px] lg:[--u:calc(100vw/1920)] [--spacing:var(--u)]'

/** Full-bleed page root: cancels the layout's category-pill clearance and spans the screen. */
export const SEARCH_PAGE = cn(
  'flex min-h-screen flex-col gap-40 bg-white px-172 pt-48 pb-64 font-(family-name:--font-dm-sans) md:mx-[calc(50%-50vw)] md:mt-[-38px] md:w-screen',
  'max-lg:gap-28 max-lg:px-16 max-lg:pt-12 max-lg:pb-96',
  SEARCH_UNIT,
)
