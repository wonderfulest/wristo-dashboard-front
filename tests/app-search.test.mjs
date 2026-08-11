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
