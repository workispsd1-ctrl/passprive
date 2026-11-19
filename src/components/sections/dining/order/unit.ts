/**
 * Design unit for Order & Collect (Figma "Flow - Order & Collect", 1920-wide
 * frames). Desktop classes are the exact Figma values in design px: `--u` is
 * 1px on a 1920 screen and proportional on every other desktop width;
 * `--spacing` follows it, so `px-172`, `h-54`, `gap-24` are design px.
 * Below lg `--u` stays 1px and the `max-lg:` classes give the phone layout
 * (written in px numbers, since `--spacing` is 1px there too).
 */
export const OC_UNIT = '[--u:1px] lg:[--u:calc(100vw/1920)] [--spacing:var(--u)]'

/** `calc(n * var(--u))` — for fonts, radii and shadows in design px. */
export const ou = (px: number) => `calc(${px}*var(--u))`

/** Full-bleed page root: cancels the layout's category-pill clearance and spans the screen. */
export const OC_PAGE =
  'min-h-screen bg-white font-(family-name:--font-dm-sans) md:mx-[calc(50%-50vw)] md:mt-[-38px] md:w-screen'
