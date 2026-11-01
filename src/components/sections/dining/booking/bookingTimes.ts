/**
 * "10:00 AM, today" — the last moment a booking can be changed or cancelled
 * for a full refund: the slot start minus the restaurant's cutoff
 * (restaurants.cancellation_cutoff_minutes). Null without a cutoff.
 */
export function cancelDeadline(dateId: string, time24: string, cutoffMinutes: number | null | undefined): string | null {
  if (cutoffMinutes == null || !Number.isFinite(Number(cutoffMinutes))) return null
  const [y, m, d] = dateId.split('-').map(Number)
  const [hh, mm] = time24.split(':').map(Number)
  const at = new Date(y, m - 1, d, hh, mm - Number(cutoffMinutes))
  if (Number.isNaN(at.getTime())) return null
  const time = at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(at)
  day.setHours(0, 0, 0, 0)
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000)
  const when = diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${time}, ${when}`
}
