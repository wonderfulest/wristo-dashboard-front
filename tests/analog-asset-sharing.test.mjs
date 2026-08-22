import test from 'node:test'
import assert from 'node:assert/strict'
import { buildAnalogAssetPageQuery } from '../src/views/design/analogAssetPageQuery.mjs'

test('analog asset page query preserves the shared filter as true false or unset', () => {
  const base = {
    pageNum: 1,
    pageSize: 20,
    analogAssetType: '',
    userId: undefined,
    isSystem: '',
    isActive: '',
    orderBy: 'updatedAt:desc',
  }

  assert.equal(buildAnalogAssetPageQuery({ ...base, isShared: 'true' }).isShared, true)
  assert.equal(buildAnalogAssetPageQuery({ ...base, isShared: 'false' }).isShared, false)
  assert.equal(buildAnalogAssetPageQuery({ ...base, isShared: '' }).isShared, undefined)
})
