import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  buildDashboardRange,
  calculateBusinessMetrics,
  formatDashboardMetric,
} from '../src/components/dashboard/dashboardOverview.mjs'

test('buildDashboardRange returns inclusive recent calendar days', () => {
  const range = buildDashboardRange('7d', new Date('2026-08-13T12:00:00'))

  assert.deepEqual(range, {
    startDate: '2026-08-07',
    endDate: '2026-08-13',
    displayPeriod: '2026-08-07 至 2026-08-13',
  })
})

test('buildDashboardRange supports dashboard single-day and three-day shortcuts', () => {
  const now = new Date('2026-08-13T12:00:00')

  assert.deepEqual(buildDashboardRange('today', now), {
    startDate: '2026-08-13', endDate: '2026-08-13', displayPeriod: '2026-08-13 至 2026-08-13',
  })
  assert.deepEqual(buildDashboardRange('yesterday', now), {
    startDate: '2026-08-12', endDate: '2026-08-12', displayPeriod: '2026-08-12 至 2026-08-12',
  })
  assert.deepEqual(buildDashboardRange('dayBeforeYesterday', now), {
    startDate: '2026-08-11', endDate: '2026-08-11', displayPeriod: '2026-08-11 至 2026-08-11',
  })
  assert.deepEqual(buildDashboardRange('3d', now), {
    startDate: '2026-08-11', endDate: '2026-08-13', displayPeriod: '2026-08-11 至 2026-08-13',
  })
})

test('calculateBusinessMetrics aggregates cents and counts without inventing comparison data', () => {
  const metrics = calculateBusinessMetrics(
    [
      { date: '2026-08-12', orderCount: 2, downloads: 80, earnings: 1298 },
      { date: '2026-08-13', orderCount: 3, downloads: 120, earnings: 2702 },
    ],
    { downloads: 200, appPurchases: 6, bundlePurchases: 4 },
  )

  assert.deepEqual(metrics, {
    revenue: 40,
    orders: 5,
    downloads: 200,
    purchaseRate: 5,
  })
})

test('calculateBusinessMetrics safely handles missing and zero funnel data', () => {
  assert.deepEqual(calculateBusinessMetrics([], null), {
    revenue: 0,
    orders: 0,
    downloads: 0,
    purchaseRate: null,
  })
})

test('formatDashboardMetric uses dashboard-friendly number formats', () => {
  assert.equal(formatDashboardMetric('revenue', 1234.5), '$1,234.50')
  assert.equal(formatDashboardMetric('orders', 1234), '1,234')
  assert.equal(formatDashboardMetric('purchaseRate', 5.25), '5.3%')
  assert.equal(formatDashboardMetric('purchaseRate', null), '-')
})

test('dashboard wires one filter to overview, sales and funnel sections', async () => {
  const source = await readFile(new URL('../src/views/dashboard/Dashboard.vue', import.meta.url), 'utf8')

  assert.match(source, /DashboardFilterBar/)
  assert.match(source, /BusinessOverview/)
  assert.match(source, /OperationsInbox/)
  assert.match(source, /:filter="dashboardFilter"/)
  assert.match(source, /@metrics-change="handleMetricsChange"/)
})

test('review time action exposes all three operational steps', async () => {
  const source = await readFile(new URL('../src/components/dashboard/ReviewTimeControl.vue', import.meta.url), 'utf8')

  assert.match(source, /Bundle 关系预处理/)
  assert.match(source, /更新审核时间/)
  assert.match(source, /重建搜索索引/)
  assert.doesNotMatch(source, /void rebuildAll\(true\)\.catch\(\(\) => undefined\)/)
})
