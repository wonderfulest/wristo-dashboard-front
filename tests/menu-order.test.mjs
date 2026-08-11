import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/config/menu.ts', import.meta.url), 'utf8')

function getTopMenuKeys() {
  return [...source.matchAll(/^    key: '([^']+)',$/gm)].map((match) => match[1])
}

function getDirectChildKeys(sectionKey) {
  const sectionStart = source.indexOf(`key: '${sectionKey}'`)
  const childrenStart = source.indexOf('children: [', sectionStart)
  const nextSectionStart = source.indexOf("\n  {\n    key: '", childrenStart)
  const sectionSource = source.slice(childrenStart, nextSectionStart === -1 ? undefined : nextSectionStart)

  return [...sectionSource.matchAll(/^      \{ key: '([^']+)'/gm)].map((match) => match[1])
}

test('顶部菜单按业务流程组织', () => {
  assert.deepEqual(getTopMenuKeys(), [
    'home',
    'content-production',
    'app-operations',
    'users-transactions',
    'marketing-growth',
    'platform-operations',
  ])
})

test('各业务域使用稳定的二级分组顺序', () => {
  assert.deepEqual(getDirectChildKeys('content-production'), [
    'design-management',
    'asset-resources',
    'data-styles',
    'theme-system',
    'build-release',
  ])
  assert.deepEqual(getDirectChildKeys('app-operations'), [
    'app-management',
    'content-operations',
    'garmin-ecosystem',
    'search-operations',
    'app-monitoring',
  ])
  assert.deepEqual(getDirectChildKeys('users-transactions'), [
    'user-services',
    'memberships-subscriptions',
    'orders-entitlements',
    'after-sales-promotions',
    'merchant-settlement',
    'management-settings',
    'profile',
  ])
})
