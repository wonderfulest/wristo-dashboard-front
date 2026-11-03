import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
import { ref, computed } from 'vue'
import { buildDashboardRange, calculateBusinessMetrics } from '../src/components/dashboard/dashboardOverview.mjs'

const source = await readFile(new URL('../src/components/dashboard/BusinessOverview.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const compiled = ts.transpile(script, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None })
function setup() {
  const requests = []
  const events = []
  const context = vm.createContext({
    ref, computed, buildDashboardRange, calculateBusinessMetrics,
    defineEmits: () => (...args) => events.push(args),
    watch: () => {},
    getBusinessOverview: query => new Promise(resolve => requests.push({ query, resolve })),
  })
  vm.runInContext(compiled + '\nglobalThis.state = { fetchMetrics, metrics, overview, loading, error, filter }', context)
  return { ...context.state, requests, events }
}
const ready = { code: 0, data: { ready: true, revenue: 1234, orders: 3, downloads: 120, firstDownloads: 100, repeatDownloads: 20, purchasedDevices: 5, updatedAt: '2026-11-03 10:00:00', lagSeconds: 30 } }

test('overview uses only preaggregated endpoint and keeps exact funnel separate', async () => {
  const api = await readFile(new URL('../src/api/purchase.ts', import.meta.url), 'utf8')
  assert.match(api, /instance.post\('\/admin\/purchases\/business-overview', dto\)/)
  assert.doesNotMatch(source, /getSales|getFunnel/)
  assert.match(api, /instance.post\('\/admin\/purchases\/funnel', dto\)/)
  assert.match(source, /metrics\?\.\[item.key\] \?\? null/)
  assert.match(source, /overview.lagSeconds > 60/)
})

test('loading and preparing never emit or display fabricated zero metrics', async () => {
  const state = setup()
  const pending = state.fetchMetrics()
  assert.equal(state.loading.value, true)
  assert.equal(state.metrics.value, null)
  state.requests[0].resolve({ code: 0, data: { ...ready.data, ready: false } })
  await pending
  assert.equal(state.loading.value, false)
  assert.equal(state.metrics.value, null)
  assert.equal(state.overview.value.ready, false)
  assert.ok(state.events.every(([, metrics]) => metrics === null))
})

test('ready response preserves cents conversion and period order purchase rate', async () => {
  const state = setup()
  const pending = state.fetchMetrics()
  state.requests[0].resolve(ready)
  await pending
  assert.equal(state.metrics.value.revenue, 12.34)
  assert.equal(state.metrics.value.downloads, 100)
  assert.equal(state.metrics.value.purchaseRate, 3)
  assert.equal(state.events.at(-1)[0], 'metrics-change')
})

test('filter change rejects stale response and forwards current filters', async () => {
  const state = setup()
  const first = state.fetchMetrics()
  state.filter.value.appId = 123
  const second = state.fetchMetrics()
  assert.equal(state.requests[1].query.appId, 123)
  state.requests[0].resolve(ready)
  await first
  assert.equal(state.metrics.value, null)
  assert.equal(state.loading.value, true)
  state.requests[1].resolve({ code: 1 })
  await second
  assert.equal(state.metrics.value, null)
  assert.equal(state.loading.value, false)
  assert.ok(state.error.value)
})
