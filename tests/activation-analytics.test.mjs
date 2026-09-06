import test from 'node:test'
import assert from 'node:assert/strict'
import { activationPercent, activationSummary, createActivationChart } from '../src/components/dashboard/activationCharts.mjs'

const items = [
  { date: '2026-09-01', totalCount: 0, codeCount: 0, codeAppCount: 0 },
  { date: '2026-09-02', totalCount: 4, codeCount: 3, codeAppCount: 2, directPurchaseCount: 1, existingBundleCount: 2, existingAppCount: 1 },
]
test('shares use all activations as denominator and handle zero days', () => {
  assert.equal(activationPercent(1, 4), 25)
  assert.equal(activationPercent(0, 0), 0)
  assert.equal(activationPercent(1, 3), 33.33)
  const summary = activationSummary(items)
  assert.equal(summary.totalCount, 4)
  assert.equal(summary.codeCount, 3)
  assert.equal(summary.existingBundleCount, 2)
  assert.equal(activationSummary([]).totalCount, 0)
})
test('unobserved dates are gaps rather than false zero counts', () => {
  const chart = createActivationChart(items, '2026-09-02T05:00:00', 'trend')
  assert.deepEqual(chart.series[0].data, [null, 3])
  assert.deepEqual(chart.series[1].data, [null, 2])
  assert.deepEqual(createActivationChart(items, null).series[0].data, [null, null])
})
test('source chart switches count and percentage without changing denominators', () => {
  const counts = createActivationChart(items, '2026-09-01T00:00:00', 'count')
  const shares = createActivationChart(items, '2026-09-01T00:00:00', 'percent')
  assert.equal(counts.series[0].data[1], 1)
  assert.equal(shares.series[0].data[1], 25)
  assert.equal(shares.series[1].data[1], 50)
  assert.equal(shares.series[2].data[1], 25)
  assert.equal(shares.yAxis.max, 100)
})
