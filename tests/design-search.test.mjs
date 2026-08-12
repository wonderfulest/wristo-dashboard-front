import test from 'node:test'
import assert from 'node:assert/strict'

import { searchDesigns } from '../src/utils/designSearch.ts'

test('设计搜索将设计名作为统一关键词交给设计分页接口', async () => {
  const calls = []
  const designs = [{ designUid: 'design-001', name: 'Stealth Chrono' }]

  const result = await searchDesigns(' Stealth Chrono ', async (params) => {
    calls.push(params)
    return { code: 0, data: { list: designs } }
  })

  assert.deepEqual(result, designs)
  assert.deepEqual(calls, [{ keyword: 'Stealth Chrono', pageNum: 1, pageSize: 20, populate: 'product' }])
})

test('设计搜索通过同一个关键词协议支持 Design ID 和 App ID', async () => {
  const calls = []

  for (const query of ['design-uid-123', '165591']) {
    await searchDesigns(query, async (params) => {
      calls.push(params)
      return { code: 0, data: { list: [] } }
    })
  }

  assert.deepEqual(calls.map((params) => params.keyword), ['design-uid-123', '165591'])
})

test('空白设计搜索不请求接口且失败响应返回空列表', async () => {
  let callCount = 0
  const request = async () => {
    callCount += 1
    return { code: 1, data: { list: [{ designUid: 'unexpected' }] } }
  }

  assert.deepEqual(await searchDesigns('   ', request), [])
  assert.deepEqual(await searchDesigns('name', request), [])
  assert.equal(callCount, 1)
})
