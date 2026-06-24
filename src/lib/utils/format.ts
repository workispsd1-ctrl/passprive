// Parses 'YYYY-MM-DD' strings without timezone drift (avoids UTC→local shift).
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// 'YYYY-MM-DD' → '5 Jan'  (booking confirmation card)
export function formatDateShort(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// 'YYYY-MM-DD' → 'Thursday, 5 January 2024'  (booking detail page)
export function formatDateFull(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// 'YYYY-MM-DD' → 'Thu, 5 Jan 2024'  (pay checkout page)
export function formatDateMedium(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ISO timestamp → '5 Jan 2024'  (wallet transaction list)
export function formatISODate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// 'HH:MM' → '7:30 PM'
export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 === 0 ? 12 : h % 12
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

// 'YYYY-MM-DD' + 'HH:MM' → '5 Jan at 7:30 PM'  (bookings list)
export function formatBookingDateTime(dateStr: string, timeStr: string): string {
  const date = parseLocalDate(dateStr)
  const day = date.getDate()
  const month = date.toLocaleDateString('en-GB', { month: 'short' })
  return `${day} ${month} at ${formatTime(timeStr)}`
}

// number → '₨1,234.56'
export function formatMRU(amount: number): string {
  return `₨${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
