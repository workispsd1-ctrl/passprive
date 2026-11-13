import { cn } from '@/lib/utils'

/**
 * Design unit for the mall page (Figma "Mall Flow", 1920-wide frames). Desktop
 * classes are the exact Figma values in design px: `--u` is 1px on a 1920
 * screen and proportional on every other desktop width (100vw / 1920);
 * `--spacing` follows it, so `px-172`, `h-392`, `gap-24` are design px.
 * Below lg `--u` stays 1px and the `max-lg:` classes give the phone layout.
 */
export const MALL_UNIT = '[--u:1px] lg:[--u:calc(100vw/1920)] [--spacing:var(--u)]'

/** Full-bleed page root: cancels the layout's category-pill clearance and spans the screen. */
export const MALL_PAGE = cn(
  'min-h-screen overflow-x-clip bg-white pb-96 font-(family-name:--font-dm-sans) md:mx-[calc(50%-50vw)] md:mt-[-38px] md:w-screen max-lg:pb-[96px]',
  MALL_UNIT,
)
