import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildDesignOutputFilter } from '../src/components/dashboard/dashboardOverview.mjs'

test('design output defaults to the current calendar day', () => {
  assert.deepEqual(buildDesignOutputFilter(new Date('2026-08-31T12:00:00')), {
    rangeType: 'today',
    startDate: '2026-08-31',
    endDate: '2026-08-31',
    appId: null,
  })
})

test('dashboard exposes design output metrics with the shared date-range choices', async () => {
  const dashboard = await readFile(new URL('../src/views/dashboard/Dashboard.vue', import.meta.url), 'utf8')
  const component = await readFile(new URL('../src/components/dashboard/DesignOutputOverview.vue', import.meta.url), 'utf8')
  const api = await readFile(new URL('../src/api/design-output-analytics.ts', import.meta.url), 'utf8')

  assert.match(dashboard, /<DesignOutputOverview\s*\/>/)
  assert.match(component, /DashboardSectionFilter/)
  assert.match(component, /:show-app="false"/)
  for (const label of ['新增设计数量', '提交审核数量', '审核通过数量', '上线数量']) {
    assert.match(component, new RegExp(label))
  }
  assert.match(component, /历史估算/)
  assert.match(api, /\/admin\/analytics\/design-output/)
})
