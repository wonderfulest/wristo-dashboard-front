import test from 'node:test'
import assert from 'node:assert/strict'
import { backfillAllCnCatalog } from '../src/utils/cnCatalogBackfill.ts'

test('全量提交遍历全部游标页并报告累计入队数量', async () => {
  const cursors = []
  const progress = []
  const pages = [
    { queued: 200, nextAfterAppId: 500, hasMore: true },
    { queued: 7, nextAfterAppId: 520, hasMore: false },
  ]
  const count = await backfillAllCnCatalog(async after => {
    cursors.push(after)
    return pages.shift()
  }, count => progress.push(count))
  assert.equal(count, 207)
  assert.deepEqual(cursors, [0, 500])
  assert.deepEqual(progress, [200, 207])
})

test('分页提交失败时停止并保留已提交进度', async () => {
  const progress = []
  await assert.rejects(backfillAllCnCatalog(async after => {
    if (after === 0) return { queued: 200, nextAfterAppId: 500, hasMore: true }
    throw new Error('网络失败')
  }, count => progress.push(count)), /网络失败/)
  assert.deepEqual(progress, [200])
})

test('拒绝不前进的游标，避免无限提交', async () => {
  await assert.rejects(backfillAllCnCatalog(async () => ({
    queued: 200, nextAfterAppId: 0, hasMore: true,
  })), /游标/)
})
