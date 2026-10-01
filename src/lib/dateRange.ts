/**
 * First and last calendar day of a `YYYY-MM` month as `YYYY-MM-DD` strings.
 * Pure string/UTC maths — never `new Date(y, m, 0).toISOString()`, which builds
 * local midnight then converts to UTC and returns the previous day in any
 * timezone ahead of UTC (e.g. London during BST), silently dropping the 30th/31st.
 */
export function monthRange(yyyyMm: string): { start: string; end: string } {
  const [yr, mo] = yyyyMm.split('-').map(Number)
  const lastDay = new Date(Date.UTC(yr, mo, 0)).getUTCDate()
  const mm = String(mo).padStart(2, '0')
  return { start: `${yr}-${mm}-01`, end: `${yr}-${mm}-${String(lastDay).padStart(2, '0')}` }
}

/** Current local month as `YYYY-MM`. */
export function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
