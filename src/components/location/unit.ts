import { cn } from '@/lib/utils'

/**
 * Design unit for the location pages (Figma "Location directory · Desktop" and
 * the Add-address frames, 1920 wide). `--u` is exactly 1px on a 1920 screen and
 * proportional on every other desktop width; `--spacing` follows it, so
 * `px-172`, `h-56`, `gap-24` are design px. Below lg the pages use their phone
 * sizes (`max-lg:`) at 1px.
 */
export const LOC_UNIT = '[--u:1px] lg:[--u:calc(100vw/1920)] [--spacing:var(--u)]'

/** Full-bleed page root: cancels the layout's category-pill clearance and spans the screen. */
export const LOC_PAGE = cn(
  'min-h-screen bg-white font-(family-name:--font-dm-sans) md:mx-[calc(50%-50vw)] md:mt-[-38px] md:w-screen',
  LOC_UNIT,
)
