import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validThresholds, createBatchRequest, batchStatus, batchFeedback } from '../src/components/tags/generationBatch.mjs'
test('thresholds require two positive integers within database range', () => {
  for (const minDownloads of [undefined, 0, -1, 1.5, NaN, 2147483648]) assert.equal(validThresholds({ minDownloads, minPurchases: 1 }), false)
  assert.equal(validThresholds({ minDownloads: 100, minPurchases: 2 }), true)
})
test('one platform batch preserves stable request identity, both OR operands and unique application IDs', () => {
  const request = createBatchRequest([{ appId: '123' }, { appId: '456' }, { appId: '123' }], { minDownloads: 100, minPurchases: 3 }, { model: 'qwen3-vl-flash', provider: 'BAILIAN' }, 'stable-id')
  assert.deepEqual(request, { minDownloads: 100, minPurchases: 3, expectedModel: 'qwen3-vl-flash', requestId: 'stable-id', appIds: ['123', '456'] })
  assert.equal('expectedCost' in request, false)
})
test('invalid model, empty selection and oversized selection fail before submission', () => {
  const thresholds = { minDownloads: 100, minPurchases: 3 }, quote = { model: 'qwen3-vl-flash', provider: 'BAILIAN' }
  assert.throws(() => createBatchRequest([], thresholds, quote, 'id'))
  assert.throws(() => createBatchRequest([{ appId: '1' }], thresholds, { ...quote, provider: 'OTHER' }, 'id'))
  assert.throws(() => createBatchRequest(Array.from({ length: 51 }, (_, appId) => ({ appId })), thresholds, quote, 'id'))
})
test('mount only reads history; generation has one explicit confirmed batch call and no credit charge', () => {
  const source = readFileSync(new URL('../src/components/tags/TagGeneration.vue', import.meta.url), 'utf8')
  assert.match(source, /onMounted\(loadJobs\)/)
  assert.match(source, /if \(!confirmVisible.value \|\| !snapshot.value \|\| running.value\) return/)
  assert.equal((source.match(/await submitBatch\(/g) || []).length, 1)
  assert.doesNotMatch(source, /generateTags|runGenerationBatch|expectedCost|creditCost|setInterval|watch\(/)
  assert.match(source, /不扣用户或管理员积分/)
  assert.match(source, /请先刷新任务列表核实，不要重复提交/)
})
test('batch status makes asynchronous progress and uncertain submission explicit', () => {
  assert.equal(batchStatus('in_progress'), '处理中')
  assert.equal(batchStatus('submission_unknown'), '提交结果待核实')
  assert.equal(batchStatus('completed'), '已完成')
  assert.equal(batchStatus('future_status'), 'future_status')
})

test('successful HTTP response with uncertain submission is never reported as submitted or completed', () => {
  assert.match(batchFeedback({ status: 'submission_unknown' }), /提交结果待核实，勿重试/)
  assert.match(batchFeedback({ status: 'submitting' }), /正在提交/)
  assert.doesNotMatch(batchFeedback({ status: 'submission_unknown' }), /已提交|已完成/)
  assert.match(batchFeedback({ status: 'in_progress', providerBatchId: 'provider-1' }), /已提交/)
  assert.match(batchFeedback({ status: 'completed', providerBatchId: 'provider-1' }), /已完成/)
})
