import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('lifecycle chart renders percentile band and lifecycle milestones', async () => {
  const source = await readFile(new URL('../src/components/dashboard/LaunchLifecycleChart.vue', import.meta.url), 'utf8')
  for (const token of ['p25Downloads', 'p50Downloads', 'p75Downloads', '峰值', '半衰期', '进入长尾', '样本量']) {
    assert.match(source, new RegExp(token))
  }
  assert.match(source, /echarts/)
  assert.match(source, /aria-label="应用生命周期曲线"/)
  assert.match(source, /aria-label="生命周期图表可横向滚动"/)
  assert.match(source, /tabindex="0"/)
  assert.match(source, /\.chart-scroll\{[^}]*overflow-x:auto/)
})
