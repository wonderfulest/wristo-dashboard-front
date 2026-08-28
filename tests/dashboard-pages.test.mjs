import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('dashboard routes expose overview, sales, launch, and value pages', async () => {
  const router = await read('src/router/index.ts')
  const routes = [
    ['/dashboard', 'Dashboard.vue'],
    ['/dashboard/sales', 'SalesAnalytics.vue'],
    ['/dashboard/launch', 'LaunchStrategy.vue'],
    ['/dashboard/value', 'ValueAnalytics.vue'],
  ]

  for (const [path, view] of routes) {
    assert.match(router, new RegExp(`path: '${path.replaceAll('/', '\\/')}'[\\s\\S]*?dashboard\\/${view}`))
  }
})

test('value analytics page owns category and designer value sections', async () => {
  const source = await read('src/views/dashboard/ValueAnalytics.vue')
  assert.match(source, /<CategoryValueMatrix\s*\/>/)
  assert.match(source, /<DesignerValueMatrix\s*\/>/)
  assert.doesNotMatch(source, /LaunchOperationsRecommendation|SalesLineChart|OperationsInbox/)
})
