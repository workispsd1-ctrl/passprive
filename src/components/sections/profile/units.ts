/**
 * Design unit for the profile page (Figma frame is 1920 wide).
 *
 * `--u` is one design pixel: exactly 1px on a 1920 screen and proportional on
 * every other desktop width (1440 → 0.75px, 2560 → 1.33px). Below `lg` the
 * page is a single column and `--u` is 1px.
 *
 * `--spacing` is pointed at `--u` too, so Tailwind's numeric utilities take
 * design px directly: `w-509` = 509 design px, `top-154`, `gap-24`,
 * `leading-21`, `size-40`. Font sizes, radii and shadows use
 * `calc(N*var(--u))` in arbitrary values.
 */
export const PROFILE_UNIT = '[--u:1px] lg:[--u:calc(100vw/1920)] [--spacing:var(--u)]'

/**
 * Phones: the booking card keeps its desktop composition but shrinks to fit
 * the screen width (528 design px wide). `--spacing` has to be re-declared
 * wherever `--u` changes, since it inherits as an already-resolved value.
 */
export const BOOKING_CARD_UNIT = 'max-lg:[--u:min(1px,calc((100vw_-_48px)/528))] max-lg:[--spacing:var(--u)]'

/** Phones: the 172px category tiles at a size where ~3 fit across. */
export const TILE_UNIT = 'max-lg:[--u:0.62px] max-lg:[--spacing:var(--u)]'
