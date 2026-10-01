// Run in a child process with TZ set by dateRange.test.ts. Prints a JSON report.
import { monthRange, toDateString } from '../src/lib/dateRange.ts'

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
const pad = (n: number) => String(n).padStart(2, '0')

const failures: string[] = []
let oldMethodWrong = 0

for (let y = 1990; y <= 2100; y++) {
  for (let m = 1; m <= 12; m++) {
    const last = m === 2 && isLeap(y) ? 29 : DAYS[m - 1]
    const key = `${y}-${pad(m)}`
    const got = monthRange(key)
    if (got.start !== `${key}-01`) failures.push(`${key} start=${got.start}`)
    if (got.end !== `${key}-${pad(last)}`) failures.push(`${key} end=${got.end}, want ${last}`)
    // The buggy idiom this module replaced — counted so the parent can prove the TZ switch works.
    // eslint-disable-next-line no-restricted-syntax -- deliberate: demonstrates the bug the rule forbids
    if (new Date(y, m, 0).toISOString().slice(0, 10) !== `${key}-${pad(last)}`) oldMethodWrong++
  }
}

// Every local calendar day, at midnight and at 23:59, must map to itself.
for (let y = 2024; y <= 2031; y++) {
  for (let m = 0; m < 12; m++) {
    const last = m === 1 && isLeap(y) ? 29 : DAYS[m]
    for (let d = 1; d <= last; d++) {
      const want = `${y}-${pad(m + 1)}-${pad(d)}`
      for (const [h, min] of [[0, 0], [0, 30], [12, 0], [23, 59]]) {
        const got = toDateString(new Date(y, m, d, h, min))
        if (got !== want) failures.push(`toDateString(${want} ${h}:${min}) = ${got}`)
      }
    }
  }
}

console.log(JSON.stringify({ failures: failures.slice(0, 10), failureCount: failures.length, oldMethodWrong }))
