import { cn } from '@/lib/utils'

/**
 * Design unit for the Favourites flow (Figma "Flow - Favourites", 1920-wide
 * frames). Every desktop class is the exact Figma value in design px: `--u` is
 * exactly 1px on a 1920 screen and proportional on every other desktop width
 * (100vw / 1920). `--spacing` follows it, so `px-172`, `h-112`, `gap-24` are
 * design px. Below lg the pages use their phone sizes (`max-lg:`) at 1px.
 * Put it on every root — portalled dialogs too.
 */
export const FAV_UNIT = '[--u:1px] lg:[--u:calc(100vw/1920)] [--spacing:var(--u)]'

/** Full-bleed page root: cancels the layout's category-pill clearance and spans the screen. */
export const FAV_PAGE = cn(
  'min-h-screen bg-white pb-[80px] font-(family-name:--font-dm-sans) md:mx-[calc(50%-50vw)] md:mt-[-38px] md:w-screen md:pb-0',
  FAV_UNIT,
)
