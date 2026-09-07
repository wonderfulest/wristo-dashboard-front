import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source = fs.readFileSync(new URL('../src/views/dashboard/packaging/PackagingQueue.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const code = ts.transpileModule(script.replace(/^import[\s\S]*?from ['"][^'"]+['"]\s*;?/gm, ''), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
function setup(update = async () => ({ code: 0 })) {
  const calls = []
  const context = {
    ref: value => ({ value }), computed: getter => ({ get value() { return getter() } }), onMounted: () => {},
    ElMessage: { error() {}, success() {}, warning() {} },
    updateProductPackagingQueuePriority: async (id, value) => { calls.push([id, value]); return update(id) },
    getProductPackagingQueue: async () => ({ code: 0, data: [] })
  }
  const state = new Function(...Object.keys(context), `${code}\nreturn { queue, designerId, designers, filteredQueue, selectedRows, clearSelection, openBatchPriorityDialog, priorityValue, submitPriority, priorityTargetRows, priorityDialogVisible, batchFailureSummary };`)(...Object.values(context))
  return { ...state, calls }
}
const row = (id, designer) => ({ id, product: { user: { id: designer, username: 'Same name' } } })
test('designer filter distinguishes identical names and clears selection', () => {
  const state = setup()
  state.queue.value = [row(1, 10), row(2, 20), row(3, 10)]
  state.designerId.value = 10
  assert.deepEqual(state.filteredQueue.value.map(item => item.id), [1, 3])
  assert.equal(state.designers.value.length, 2)
  state.selectedRows.value = state.filteredQueue.value
  state.clearSelection()
  assert.equal(state.selectedRows.value.length, 0)
  state.designerId.value = ''
  assert.equal(state.filteredQueue.value.length, 3)
})
test('batch continues after errors and retries only failed tasks', async () => {
  let fail = true
  const state = setup(async id => {
    if (fail && id === 2) throw new Error('network')
    return { code: fail && id === 3 ? 1 : 0 }
  })
  state.selectedRows.value = [row(1, 10), row(2, 10), row(3, 10)]
  state.openBatchPriorityDialog()
  state.priorityValue.value = 0
  await state.submitPriority()
  assert.deepEqual(state.calls, [[1, 0], [2, 0], [3, 0]])
  assert.deepEqual(state.priorityTargetRows.value.map(item => item.id), [2, 3])
  assert.match(state.batchFailureSummary.value, /成功 1 条，失败 2 条/)
  assert.equal(state.priorityDialogVisible.value, true)
  fail = false
  await state.submitPriority()
  assert.deepEqual(state.calls.slice(3), [[2, 0], [3, 0]])
  assert.equal(state.priorityDialogVisible.value, false)
})
test('invalid priorities never submit requests', async () => {
  const state = setup()
  state.selectedRows.value = [row(1, 10)]
  state.openBatchPriorityDialog()
  for (const value of [null, '', -1, 10, 1.5]) {
    state.priorityValue.value = value
    await state.submitPriority()
  }
  assert.deepEqual(state.calls, [])
})
