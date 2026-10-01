/**
 * Calendar-date helpers. ALL date-only (`YYYY-MM-DD` / `YYYY-MM`) strings in the
 * app must come from here — never from `date.toISOString().slice(0, 10)` or
 * `.split('T')[0]`. `toISOString()` converts to UTC first, so in any timezone
 * ahead of UTC (London during BST, Spain, Ecuador's neighbours to the east…) a
 * local-midnight Date lands on the PREVIOUS day. That silently dropped the last
 * day of every BST month from the Pay Records filters (30 Sept 2026) and made
 * "today" wrong between 00:00 and 01:00. ESLint forbids the pattern.
 */

/** A Date's LOCAL calendar day as `YYYY-MM-DD`. */
export function toDateString(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Today's LOCAL calendar day as `YYYY-MM-DD`. */
export function todayString(): string {
  return toDateString(new Date())
}

/** Current local month as `YYYY-MM`. */
export function currentMonthKey(): string {
  return todayString().slice(0, 7)
}

/**
 * First and last calendar day of a `YYYY-MM` month as `YYYY-MM-DD` strings.
 * Pure UTC arithmetic on the numbers, so it is independent of the machine's
 * timezone and correct for every year (leap years included).
 */
export function monthRange(yyyyMm: string): { start: string; end: string } {
  const [yr, mo] = yyyyMm.split('-').map(Number)
  const lastDay = new Date(Date.UTC(yr, mo, 0)).getUTCDate()
  const mm = String(mo).padStart(2, '0')
  return { start: `${yr}-${mm}-01`, end: `${yr}-${mm}-${String(lastDay).padStart(2, '0')}` }
}
