import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const salesSource = readFileSync(new URL('../src/components/dashboard/AppSalesSummary.vue', import.meta.url), 'utf8')
const dashboardSource = readFileSync(new URL('../src/views/dashboard/Dashboard.vue', import.meta.url), 'utf8')
const filterSource = readFileSync(new URL('../src/components/dashboard/DashboardSectionFilter.vue', import.meta.url), 'utf8')

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

test('dashboard mounts an independent app download ranking', () => {
  assert.match(dashboardSource, /import AppDownloadRanking/)
  assert.match(dashboardSource, /<AppDownloadRanking\s*\/>/)
})

test('download ranking component uses a 30-day filter and paginated download endpoint', () => {
  const downloadsSource = readFileSync(
    new URL('../src/components/dashboard/AppDownloadRanking.vue', import.meta.url),
    'utf8',
  )
  assert.match(downloadsSource, /DashboardSectionFilter/)
  assert.match(downloadsSource, /buildDashboardRange\('30d'\)/)
  assert.match(downloadsSource, /getAppDownloadSummaryPage/)
  assert.match(downloadsSource, /downloadCount/)
})
