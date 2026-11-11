/** "Created Mar 2026" — app parity: SavedRestaurants `formatCreated` (Indian/Mauritius time). */
export function formatCreated(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `Created ${d.toLocaleDateString('en-GB', { timeZone: 'Indian/Mauritius', month: 'short', year: 'numeric' })}`
}
