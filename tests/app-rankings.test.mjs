import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const salesSource = readFileSync(new URL('../src/components/dashboard/AppSalesSummary.vue', import.meta.url), 'utf8')
const salesPageSource = readFileSync(new URL('../src/views/dashboard/SalesAnalytics.vue', import.meta.url), 'utf8')
const downloadsPageSource = readFileSync(new URL('../src/views/dashboard/DownloadRecords.vue', import.meta.url), 'utf8')
const filterSource = readFileSync(new URL('../src/components/dashboard/DashboardSectionFilter.vue', import.meta.url), 'utf8')
const downloadsSource = readFileSync(
  new URL('../src/components/dashboard/AppDownloadRanking.vue', import.meta.url),
  'utf8',
)

test('section filter can hide app selection for cross-app rankings', () => {
  assert.match(filterSource, /showApp/)
  assert.match(filterSource, /v-if="showApp"/)
})

test('app sales summary has its own 30-day time filter and sends both dates', () => {
  assert.match(salesSource, /DashboardSectionFilter/)
  assert.match(salesSource, /buildDashboardRange\('30d'\)/)
  assert.match(salesSource, /startDate:\s*filter\.value\.startDate/)
  assert.match(salesSource, /endDate:\s*filter\.value\.endDate/)
})

test('download analysis owns ranking and records, separate from sales', () => {
  assert.doesNotMatch(salesPageSource, /AppDownloadRanking/)
  assert.match(downloadsPageSource, /<AppDownloadRanking/)
  assert.match(downloadsPageSource, /<DownloadRecordTable/)
  assert.match(downloadsPageSource, /@view-records="viewRecords"/)
})

test('download ranking component uses a 30-day filter and paginated download endpoint', () => {
  assert.match(downloadsPageSource, /DashboardSectionFilter/)
  assert.match(downloadsPageSource, /buildDashboardRange\('30d'\)/)
  assert.match(downloadsSource, /startDate: props.filter.startDate/)
  assert.match(downloadsSource, /endDate: props.filter.endDate/)
  assert.match(downloadsSource, /getAppDownloadSummaryPage/)
  assert.match(downloadsSource, /downloadCount/)
})

test('both app ranking tables keep rank first and constrain the app column', () => {
  for (const source of [salesSource, downloadsSource]) {
    const rankColumn = source.indexOf('label="排名"')
    const appColumn = source.indexOf('label="应用"')
    assert.ok(rankColumn >= 0, 'ranking column is present')
    assert.ok(rankColumn < appColumn, 'ranking column comes before the app column')
    assert.match(source, /label="应用" width="320"/)
  }
})

test('both app ranking tables preserve Garmin image links with hover zoom', () => {
  for (const source of [salesSource, downloadsSource]) {
    assert.match(source, /:href="row\.app\?\.garminStoreUrl"/)
    assert.match(source, /target="_blank"/)
    assert.match(source, /rel="noopener noreferrer"/)
    assert.match(source, /\.app-link:hover \.app-thumb/)
  }
})
