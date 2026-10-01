import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const worker = fileURLToPath(new URL('./tz-worker.ts', import.meta.url))

// Timezones both ahead of and behind UTC, with and without DST, incl. the extreme +14.
const ZONES = [
  'UTC',
  'Europe/London', // BST — the zone that hid 30 Sept 2026
  'Europe/Madrid',
  'America/Los_Angeles',
  'America/Guayaquil',
  'Asia/Kolkata',
  'Australia/Lord_Howe', // 30-minute DST shift
  'Pacific/Auckland',
  'Pacific/Kiritimati', // UTC+14
]

for (const tz of ZONES) {
  test(`monthRange / toDateString are correct for every month 1990-2100 in ${tz}`, () => {
    const res = spawnSync(process.execPath, [worker], { env: { ...process.env, TZ: tz }, encoding: 'utf8' })
    assert.equal(res.status, 0, res.stderr)
    const report = JSON.parse(res.stdout) as { failures: string[]; failureCount: number; oldMethodWrong: number }
    assert.equal(report.failureCount, 0, report.failures.join('\n'))
  })
}

test('guard has teeth: the old toISOString idiom IS wrong in Europe/London (so a regression would fail above)', () => {
  const res = spawnSync(process.execPath, [worker], { env: { ...process.env, TZ: 'Europe/London' }, encoding: 'utf8' })
  const report = JSON.parse(res.stdout) as { oldMethodWrong: number }
  assert.ok(report.oldMethodWrong > 0, 'timezone switching did not take effect — the tests above prove nothing')
})
