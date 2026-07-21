import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/config/menu.ts', import.meta.url), 'utf8')

function getFirstChildKey(sectionKey) {
  const sectionStart = source.indexOf(`key: '${sectionKey}'`)
  const childrenStart = source.indexOf('children: [', sectionStart)
  const firstChild = source.slice(childrenStart).match(/key: '([^']+)'/)

  return firstChild?.[1]
}

test('设计管理将设计审核显示为第一项', () => {
  assert.equal(getFirstChildKey('design'), 'design-review')
})

test('应用管理将最近上线显示为第一项', () => {
  assert.equal(getFirstChildKey('products'), 'products-recent-online')
})
