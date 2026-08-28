import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('launch strategy mounts overview trend and dimension insight blocks', async () => {
  const page = await readFile(new URL('../src/views/dashboard/LaunchStrategy.vue', import.meta.url), 'utf8')
  const component = await readFile(new URL('../src/components/dashboard/LaunchSalesInsights.vue', import.meta.url), 'utf8')
  const api = await readFile(new URL('../src/api/launch-analytics.ts', import.meta.url), 'utf8')

  assert.match(page, /<LaunchSalesInsights/)
  for (const label of ['首发效果总览', '上线与销量趋势', '维度拆分']) assert.match(component, new RegExp(label))
  for (const label of ['直接购买', 'Bundle 归因', '净收入', '退款金额', '新品销售贡献率']) assert.match(component, new RegExp(label))
  for (const label of ['设计师', '主分类', '价格区间', '语言', '设备覆盖']) assert.match(component, new RegExp(label))
  assert.match(component, /DashboardSectionFilter/)
  assert.match(api, /\/sales-insights/)
})
