import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('bulk category API targets all products with one category id', async () => {
  const source = await readFile(new URL('../src/api/products.ts', import.meta.url), 'utf8')

  assert.match(source, /manageCategoryForAllProducts/)
  assert.match(source, /\/admin\/products\/category\/all\/\$\{categoryId\}/)
})

test('products page derives the only allowed action from whole slug', async () => {
  const source = await readFile(new URL('../src/views/products/Products.vue', import.meta.url), 'utf8')

  assert.match(source, /一键管理分类/)
  assert.match(source, /bulkCategorySelection/)
  assert.match(source, /selectedBulkCategory/)
  assert.match(source, /slug\s*===\s*['"]whole['"]/)
  assert.match(source, /加入所有应用/)
  assert.match(source, /清空该分类/)
  assert.match(source, /所有应用/)
  assert.match(source, /manageCategoryForAllProducts/)
})
