import test from 'node:test'
import assert from 'node:assert/strict'
import { loadReviewCounts, requireCount, reviewCategories } from '../src/components/dashboard/reviewCenter.mjs'

test('accepts exact zero and counts beyond a list page, rejects unavailable or invalid counts', () => {
  for (const value of [0, 325]) assert.equal(requireCount({ code: 0, data: { total: value } }, 'total'), value)
  for (const response of [undefined, { code: 0 }, { code: 500, data: { total: 0 } }, ...[null, '3', -1, NaN, 1.5].map(total => ({ code: 0, data: { total } }))]) {
    assert.throws(() => requireCount(response, 'total'))
  }
})

test('partial failure remains unknown without hiding successful queues', async () => {
  const loaders = Object.fromEntries(reviewCategories.map(({ key }) => [key, async () => 12]))
  loaders.comments = async () => { throw new Error('offline') }
  const result = await loadReviewCounts(loaders)
  assert.deepEqual(result.comments, { count: null, error: true })
  assert.equal(reviewCategories.find(item => item.key === 'promoterApplications')?.path, '/marketing/miniapp/promoter-applications')
  assert.deepEqual(result.promoterApplications, { count: 12, error: false })
  assert.deepEqual(result.designs, { count: 12, error: false })
  assert.deepEqual(result.reports, { count: 12, error: false })
  loaders.comments = async () => 0
  assert.deepEqual((await loadReviewCounts(loaders)).comments, { count: 0, error: false })
})
