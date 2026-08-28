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

test('dashboard overview and sales pages separate operational and sales sections', async () => {
  const source = await readFile(new URL('../src/views/dashboard/Dashboard.vue', import.meta.url), 'utf8')
  const salesPage = await readFile(new URL('../src/views/dashboard/SalesAnalytics.vue', import.meta.url), 'utf8')
  const overview = await readFile(new URL('../src/components/dashboard/BusinessOverview.vue', import.meta.url), 'utf8')
  const sales = await readFile(new URL('../src/components/dashboard/SalesLineChart.vue', import.meta.url), 'utf8')
  const funnel = await readFile(new URL('../src/components/dashboard/FunnelAnalytics.vue', import.meta.url), 'utf8')
  const filter = await readFile(new URL('../src/components/dashboard/DashboardSectionFilter.vue', import.meta.url), 'utf8')

  assert.doesNotMatch(source, /dashboardFilter/)
  assert.match(source, /<DashboardFilterBar\s*\/>/)
  assert.match(source, /<BusinessOverview\s*\/>/)
  assert.match(source, /OperationsInbox/)
  assert.doesNotMatch(source, /SalesLineChart|FunnelAnalytics|LaunchOperationsRecommendation|CategoryValueMatrix/)
  assert.match(salesPage, /<SalesLineChart\s*\/>/)
  assert.match(salesPage, /<FunnelAnalytics\s*\/>/)
  for (const component of ['DeviceOrderSummary', 'CountryOrderDistribution', 'AppSalesSummary', 'AppDownloadRanking']) {
    assert.match(salesPage, new RegExp(`<${component}\\s*/>`))
  }
  for (const component of [overview, sales, funnel]) {
    assert.match(component, /DashboardSectionFilter/)
    assert.match(component, /ref<DashboardFilter>/)
  }
  assert.match(filter, />当日</)
  assert.match(filter, />昨天</)
  assert.match(filter, />前天</)
  assert.match(filter, />近三天</)
  assert.match(filter, /AppSearchSelect/)
  assert.match(filter, />刷新数据</)
})

test('review time action exposes all three operational steps', async () => {
  const source = await readFile(new URL('../src/components/dashboard/ReviewTimeControl.vue', import.meta.url), 'utf8')

  assert.match(source, /Bundle 关系预处理/)
  assert.match(source, /更新审核时间/)
  assert.match(source, /重建搜索索引/)
  assert.match(source, /提交后台重建任务/)
  assert.match(source, /索引重建已提交后台执行/)
})
