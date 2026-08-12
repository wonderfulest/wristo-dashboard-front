import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('dashboard 单应用统计筛选统一使用 AppSearchSelect', async () => {
  const files = [
    'src/components/dashboard/SalesLineChart.vue',
    'src/components/dashboard/FunnelAnalytics.vue',
  ]

  for (const file of files) {
    const source = await readSource(file)

    assert.match(source, /<AppSearchSelect\b[^>]*v-model="appId"/s, file)
    assert.match(source, /<AppSearchSelect\b[^>]*size="small"/s, file)
    assert.match(source, /import AppSearchSelect from '@\/components\/common\/AppSearchSelect\.vue'/, file)
    assert.doesNotMatch(source, /placeholder="应用ID\(可选\)"/, file)
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
