import test from 'node:test'
import assert from 'node:assert/strict'

import { buildBottomLineChartLayout } from '../src/components/dashboard/dashboardChartOptions.mjs'

test('bottom line chart layout keeps zero-value lines above the axis and clear of the legend', () => {
  const layout = buildBottomLineChartLayout()

  assert.deepEqual(layout.legend, { bottom: 0 })
  assert.equal(layout.grid.bottom, 68)
  assert.equal(layout.yAxisMin({ min: 0, max: 6 }), -0.3)
  assert.equal(layout.yAxisMin({ min: 2, max: 6 }), undefined)
})
