import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/views/dashboard/packaging/PackagingDeadQueue.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const code = ts.transpileModule(script.replace(/^import[\s\S]*?from ['"][^'"]+['"]\s*;?/gm, ''), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 }
}).outputText

function setup(overrides = {}) {
  const calls = [], messages = [], confirmations = []
  let refreshes = 0
  const context = {
    ref: value => ({ value }), onMounted: () => {},
    ElMessage: Object.fromEntries(['success', 'warning', 'error'].map(type => [type, message => messages.push([type, message])])),
    ElMessageBox: { confirm: async message => { confirmations.push(message) } },
    removeProductPackagingDeadQueueItem: async id => { calls.push(id); return { code: 0 } },
    getProductPackagingDeadQueue: async () => { refreshes++; return { code: 0, data: [] } },
    ...overrides
  }
  const state = new Function(...Object.keys(context), `${code}\nreturn { deleteDeadTasks, deleting, selectedDeadQueue, submittingRequeue, deadQueue };`)(...Object.values(context))
  return { ...state, calls, messages, confirmations, get refreshes() { return refreshes } }
}

test('single deletion confirms the ID, refreshes and clears selection', async () => {
  const state = setup()
  state.selectedDeadQueue.value = [{ id: 101 }]
  await state.deleteDeadTasks(state.selectedDeadQueue.value)
  assert.match(state.confirmations[0], /101.*保留打包历史记录/)
  assert.deepEqual(state.calls, [101])
  assert.equal(state.refreshes, 1)
  assert.deepEqual(state.selectedDeadQueue.value, [])
  assert.equal(state.deleting.value, false)
})

test('confirmation snapshots selection and prevents duplicate requests', async () => {
  let confirm
  const state = setup({ ElMessageBox: { confirm: () => new Promise(resolve => { confirm = resolve }) } })
  const rows = [{ id: 1 }, { id: 2 }]
  const pending = state.deleteDeadTasks(rows)
  rows.push({ id: 3 })
  await state.deleteDeadTasks(rows)
  assert.deepEqual(state.calls, [])
  confirm()
  await pending
  assert.deepEqual(state.calls, [1, 2])
  assert.equal(state.refreshes, 1)
})

test('cancelled confirmation never deletes or refreshes', async () => {
  const state = setup({ ElMessageBox: { confirm: async () => { throw 'cancel' } } })
  await state.deleteDeadTasks([{ id: 1 }])
  assert.deepEqual(state.calls, [])
  assert.equal(state.refreshes, 0)
  assert.equal(state.deleting.value, false)
})

test('batch continues through network and API errors and reports partial results', async () => {
  const calls = []
  const state = setup({ removeProductPackagingDeadQueueItem: async id => {
    calls.push(id)
    if (id === 1) throw new Error('network')
    return { code: id === 2 ? 1 : 0 }
  } })
  await state.deleteDeadTasks([{ id: 1 }, { id: 2 }, { id: 3 }])
  assert.deepEqual(calls, [1, 2, 3])
  assert.deepEqual(state.messages, [['warning', '已删除 1 条，2 条失败，请重试']])
  assert.equal(state.refreshes, 1)
  assert.equal(state.deleting.value, false)
})

test('all failures never report success; empty selection or requeue in progress never deletes', async () => {
  const state = setup({ removeProductPackagingDeadQueueItem: async () => ({ code: 1 }) })
  await state.deleteDeadTasks([{ id: 1 }])
  assert.deepEqual(state.messages, [['error', '删除失败，共 1 条，请重试']])
  assert.equal(state.deleting.value, false)
  const idle = setup()
  await idle.deleteDeadTasks([])
  idle.submittingRequeue.value = true
  await idle.deleteDeadTasks([{ id: 1 }])
  assert.deepEqual(idle.calls, [])
  assert.deepEqual(idle.confirmations, [])
})
