import test from 'node:test'
import assert from 'node:assert/strict'

import { searchApps } from '../src/utils/appSearch.ts'

test('纯数字关键词按 appId 精确搜索应用', async () => {
  const calls = []
  const product = { appId: 165591, name: 'Stealth Chrono' }

  const result = await searchApps(' 165591 ', {
    getByAppId: async (appId) => {
      calls.push(['appId', appId])
      return { code: 0, data: product }
    },
    searchByName: async (keyword) => {
      calls.push(['name', keyword])
      return { code: 0, data: { list: [] } }
    },
  })

  assert.deepEqual(result, [product])
  assert.deepEqual(calls, [['appId', 165591]])
})

test('非数字关键词按应用名搜索应用', async () => {
  const calls = []
  const products = [{ appId: 165591, name: 'Stealth Chrono' }]

  const result = await searchApps(' Stealth Chrono ', {
    getByAppId: async (appId) => {
      calls.push(['appId', appId])
      return { code: 0, data: null }
    },
    searchByName: async (keyword, pageNum, pageSize) => {
      calls.push(['name', keyword, pageNum, pageSize])
      return { code: 0, data: { list: products } }
    },
  })

  assert.deepEqual(result, products)
  assert.deepEqual(calls, [['name', 'Stealth Chrono', 1, 20]])
})

const { appSearchParams } = await import('../src/utils/appSearch.ts')

test('列表和选择框共用 ID / 名称识别规则', () => {
  assert.deepEqual(appSearchParams(' 00165591 '), { appId: 165591 })
  assert.deepEqual(appSearchParams(' Chrono 2 '), { name: 'Chrono 2' })
  assert.deepEqual(appSearchParams(' 中文表盘 '), { name: '中文表盘' })
  assert.deepEqual(appSearchParams('  '), {})
  for (const keyword of ['0', '000', '9007199254740992']) {
    assert.deepEqual(appSearchParams(keyword), { appId: 0 })
  }
})

test('未命中 appId 不回退名称搜索；空白和无效数字不发请求', async () => {
  const ids = []
  const dependencies = {
    getByAppId: async id => { ids.push(id); return { code: 0, data: null } },
    searchByName: async () => { assert.fail('must not fall back to name search') },
  }
  for (const keyword of ['165591', '', ' ', '0', '9007199254740992']) {
    assert.deepEqual(await searchApps(keyword, dependencies), [])
  }
  assert.deepEqual(ids, [165591])
})
