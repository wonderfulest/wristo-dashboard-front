import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const readSource = (path) => readFile(new URL(path, root), 'utf8')

test('every lazy-loaded dashboard view exists', async () => {
  const routerSource = await readSource('src/router/index.ts')
  const viewImports = [...routerSource.matchAll(/import\('@\/views\/([^']+\.vue)'\)/g)]
    .map((match) => match[1])

  assert.ok(viewImports.length > 40, 'expected the complete dashboard route inventory')

  await Promise.all(viewImports.map(async (viewPath) => {
    await access(fileURLToPath(new URL(`src/views/${viewPath}`, root)))
  }))
})

test('shared shell declares the mobile navigation and overflow contract', async () => {
  const [layout, globalStyles, elementStyles, tableShell] = await Promise.all([
    readSource('src/layout/Layout.vue'),
    readSource('src/assets/styles/global.scss'),
    readSource('src/assets/styles/element-plus.scss'),
    readSource('src/components/common/ResponsiveTableShell.vue'),
  ])

  assert.match(layout, /mobile-menu-drawer/)
  assert.match(layout, /data-mobile-table-fallback/)
  assert.match(globalStyles, /@media \(max-width: 768px\)/)
  assert.match(globalStyles, /\.mobile-data-card/)
  assert.match(elementStyles, /\.el-dialog/)
  assert.match(elementStyles, /\.el-pagination/)
  assert.match(elementStyles, /\.el-table/)
  assert.match(elementStyles, /overflow-x:\s*auto/)
  assert.match(tableShell, /aria-label="表格可横向滚动"/)
  assert.match(tableShell, /tabindex="0"/)
})

test('high-frequency lists expose a dedicated mobile data mode', async () => {
  const highFrequencyViews = [
    'src/views/products/Products.vue',
    'src/views/products/RecentOnline.vue',
    'src/views/orders/History.vue',
    'src/views/orders/OrdersTrials.vue',
    'src/views/orders/OrdersRefund.vue',
    'src/views/orders/OrdersPaddleRefunds.vue',
    'src/views/UserManagement.vue',
    'src/views/merchant/Merchant.vue',
    'src/views/merchant/MerchantPayouts.vue',
  ]

  const uncovered = []
  for (const viewPath of highFrequencyViews) {
    const source = await readSource(viewPath)
    const hasDedicatedMode =
      source.includes('ResponsiveTableShell') ||
      source.includes('mobile-card-list') ||
      source.includes('class="table-scroll"')

    if (!hasDedicatedMode) uncovered.push(viewPath)
  }

  assert.deepEqual(uncovered, [])
})
