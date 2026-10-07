import test from 'node:test'
import assert from 'node:assert/strict'
import { activationPlatformLabel, platformSummary, platformTrend } from '../src/components/dashboard/activationPlatforms.mjs'

test('platform labels preserve mini program subtype and fall back for legacy events', () => {
  assert.equal(activationPlatformLabel('MINI_PROGRAM', 'WECHAT'), '微信小程序')
  assert.equal(activationPlatformLabel('MINI_PROGRAM', 'XIAOHONGSHU'), '小红书小程序')
  assert.equal(activationPlatformLabel('IOS', 'WECHAT'), 'iOS')
  assert.equal(activationPlatformLabel(null), '未知')
})
test('summary keeps server deduplicated users and includes zero platforms', () => {
  const rows = platformSummary([{ activationPlatform: 'IOS', activationCount: 8, userCount: 3 }])
  assert.equal(rows.length, 6)
  assert.equal(rows.find(row => row.value === 'IOS').userCount, 3)
  assert.equal(rows.find(row => row.value === 'WRISTO_CN').activationCount, 0)
})
test('trend fills missing observed days and selected platform isolates series', () => {
  const dates = ['2026-10-05', '2026-10-06']
  const daily = [{ date: dates[0], activationPlatform: 'IOS', activationCount: 5, userCount: 2 }]
  const chart = platformTrend(dates, daily, 'IOS')
  assert.deepEqual(chart.series[0].data, [5, 0])
  assert.equal(chart.series.length, 1)
  assert.equal(platformTrend(dates, daily).series.length, 6)
  assert.equal(platformTrend([dates[0]], daily, 'IOS').series[0].showSymbol, true)
})
