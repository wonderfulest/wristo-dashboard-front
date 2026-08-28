import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('category and designer value tables show raw evidence and sample status', async () => {
  const sources = await Promise.all([
    readFile(new URL('../src/components/dashboard/CategoryValueMatrix.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/dashboard/DesignerValueMatrix.vue', import.meta.url), 'utf8'),
  ])
  for (const source of sources) {
    for (const label of ['规模营收', '单款效率', '爆款率', '首发成功率', '稳定性', '样本不足']) {
      assert.match(source, new RegExp(label))
    }
    assert.match(source, /ResponsiveTableShell/)
  }
})
