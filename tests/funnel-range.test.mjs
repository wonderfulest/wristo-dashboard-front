import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildCompletedDayRange } from '../src/components/dashboard/funnelRange.mjs'

test('dashboard funnel and sales trend display half-open natural-day intervals', async () => {
  const funnel = await readFile(new URL('../src/components/dashboard/FunnelAnalytics.vue', import.meta.url), 'utf8')
  const sales = await readFile(new URL('../src/components/dashboard/SalesLineChart.vue', import.meta.url), 'utf8')
  assert.match(funnel, /统计周期：\{\{ displayPeriod \}\}/)
  assert.doesNotMatch(funnel, /funnel\?\.periodKey \|\| displayPeriod/)
  assert.match(sales, /<template #header>/)
  assert.match(sales, /统计周期：\{\{ displayPeriod \}\}/)
})

test('completed natural-day ranges are half-open and exclude today', () => {
  const now = new Date(2026, 6, 17, 18, 0, 0)
  assert.deepEqual(buildCompletedDayRange(7, now), {
    startDate: '2026-07-10',
    endDate: '2026-07-16',
    displayPeriod: '[2026-07-10 00:00, 2026-07-17 00:00)',
  })
})
