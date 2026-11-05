/**
 * Lengths for the desktop restaurant page, measured on the Figma 1920 frame
 * (PASS-PRIVE-HOMEPAGE "Dining - Pay Bill"). `--u` is one design pixel:
 * 1px on a 1920 screen, scaled down with the viewport on laptops (set on the
 * page's <main>). `u(44)` → 44 design px at the current screen width.
 */
export const u = (px: number) => `calc(${px} * var(--u))`

/** The CSS value for `--u`: 100vw / 1920, never above 1px, never below 0.5px. */
export const DESIGN_UNIT = 'max(0.5px, min(1px, calc(100vw / 1920)))'

/**
 * Type and control sizes (fonts, buttons, pills, icons, card padding,
 * vertical rhythm) use `--t` instead: a laptop-sized scale stepped by
 * Tailwind breakpoint (see TYPE_SCALE), so laptops get readable — not
 * blown-up — text while the layout above still fills the screen.
 */
export const t = (px: number) => `calc(${px} * var(--t))`

/** `t`, but never below `min` px, so small print and tap targets stay usable on laptops. */
export const tMin = (px: number, min: number) => `max(${min}px, ${t(px)})`

/** Tailwind classes setting `--t` per breakpoint — 1 design px only on full 1920 screens. */
export const TYPE_SCALE =
  'md:[--t:0.5px] lg:[--t:0.58px] xl:[--t:0.65px] 2xl:[--t:0.78px] min-[120rem]:[--t:1px]'
