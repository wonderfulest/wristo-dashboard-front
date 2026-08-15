import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('dashboard 单应用统计筛选统一使用 AppSearchSelect', async () => {
  const filter = await readSource('src/components/dashboard/DashboardSectionFilter.vue')
  assert.match(filter, /<AppSearchSelect\b[^>]*v-model="appId"/s)
  assert.match(filter, /<AppSearchSelect\b[^>]*size="small"/s)
  assert.match(filter, /import AppSearchSelect from '@\/components\/common\/AppSearchSelect\.vue'/)
  assert.doesNotMatch(filter, /placeholder="应用ID\(可选\)"/)

  const consumers = [
    'src/components/dashboard/BusinessOverview.vue',
    'src/components/dashboard/SalesLineChart.vue',
    'src/components/dashboard/FunnelAnalytics.vue',
  ]

  for (const file of consumers) {
    const source = await readSource(file)
    assert.match(source, /<DashboardSectionFilter\b[^>]*v-model="filter"/s, file)
  }
})

test('统一应用搜索组件向 Element Plus 选择器传递尺寸', async () => {
  const source = await readSource('src/components/common/AppSearchSelect.vue')

  assert.match(source, /:size="size"/)
  assert.match(source, /size\?: 'large' \| 'default' \| 'small'/)
})

test('单应用选择入口不再覆盖为仅按名称搜索的提示', async () => {
  const files = [
    'src/views/meter/AppDetail.vue',
    'src/views/products/DeleteFromGarmin.vue',
  ]

  for (const file of files) {
    const source = await readSource(file)

    assert.doesNotMatch(source, /placeholder="搜索应用（按名称）"/, file)
  }
})
