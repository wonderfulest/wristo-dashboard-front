import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import * as funnelRange from '../src/components/dashboard/funnelRange.mjs'

const {
  buildCompletedDayRange,
  buildCurrentDayRange,
  buildRecentDayRange,
} = funnelRange

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

test('sales trend recent ranges include the current day', () => {
  const now = new Date(2026, 6, 17, 18, 23, 0)
  assert.deepEqual(buildRecentDayRange(7, now), {
    startDate: '2026-07-11',
    endDate: '2026-07-17',
    displayPeriod: '[2026-07-11 00:00, 2026-07-18 00:00)',
  })
})

test('current-day range covers local midnight through now', () => {
  const now = new Date(2026, 6, 17, 18, 23, 0)
  assert.deepEqual(buildCurrentDayRange(now), {
    startDate: '2026-07-17',
    endDate: '2026-07-17',
    displayPeriod: '[2026-07-17 00:00, 2026-07-17 18:23]',
  })
})

test('historical single-day ranges select yesterday and the day before yesterday', () => {
  assert.equal(typeof funnelRange.buildHistoricalDayRange, 'function')
  const now = new Date(2026, 6, 17, 18, 23, 0)
  assert.deepEqual(funnelRange.buildHistoricalDayRange(1, now), {
    startDate: '2026-07-16',
    endDate: '2026-07-16',
    displayPeriod: '[2026-07-16 00:00, 2026-07-17 00:00)',
  })
  assert.deepEqual(funnelRange.buildHistoricalDayRange(2, now), {
    startDate: '2026-07-15',
    endDate: '2026-07-15',
    displayPeriod: '[2026-07-15 00:00, 2026-07-16 00:00)',
  })
})

test('dashboard funnel exposes yesterday and day-before-yesterday options', async () => {
  const funnel = await readFile(new URL('../src/components/dashboard/FunnelAnalytics.vue', import.meta.url), 'utf8')
  assert.match(funnel, /<el-radio-button label="yesterday">昨天<\/el-radio-button>/)
  assert.match(funnel, /<el-radio-button label="dayBeforeYesterday">前天<\/el-radio-button>/)
  assert.doesNotMatch(funnel, />近1天<\/el-radio-button>/)
  assert.match(funnel, /buildHistoricalDayRange\(historicalDayOffsets\[rangeType\.value\]\)/)
})

test('dashboard exposes today conversion option and uses current-day ranges', async () => {
  const funnel = await readFile(new URL('../src/components/dashboard/FunnelAnalytics.vue', import.meta.url), 'utf8')
  const sales = await readFile(new URL('../src/components/dashboard/SalesLineChart.vue', import.meta.url), 'utf8')
  assert.match(funnel, /<el-radio-button label="today">当天<\/el-radio-button>/)
  assert.match(funnel, /buildCurrentDayRange/)
  assert.match(funnel, /rangeType\.value === 'today' \|\| !dateRange\.value/)
  assert.match(sales, /buildRecentDayRange/)
})
