import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source = fs.readFileSync(new URL('../src/views/dashboard/packaging/PackagingQueue.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
const code = ts.transpileModule(script.replace(/^import[\s\S]*?from ['"][^'"]+['"]\s*;?/gm, ''), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
function setup(update = async () => ({ code: 0 }), overrides = {}) {
  const calls = []
  const context = {
    ref: value => ({ value }), computed: getter => ({ get value() { return getter() } }), onMounted: () => {}, onUnmounted: () => {},
    ElMessage: { error() {}, success() {}, warning() {} },
    updateProductPackagingQueuePriority: async (id, value) => { calls.push([id, value]); return update(id) },
    getPackagingChannels: async () => ({ code: 0, data: [] }),
    setPackagingChannelPause: async () => ({ code: 0 }),
    getProductPackagingQueue: async () => ({ code: 0, data: [] }),
    getRunningProductPackagingTasks: async () => ({ code: 0, data: [] }),
    getProductPackagingQueuePause: async () => ({ code: 0, data: false }),
    getProductPackagingDeadQueue: async () => ({ code: 0, data: [] }),
    getProductPackagingQueueProtocol: async () => ({ code: 0, data: { legacyWorkerActive: false } }),
    setProductPackagingQueuePause: async () => ({ code: 0 }),
    ...overrides
  }
  const state = new Function(...Object.keys(context), `${code}\nreturn { channels, handleToggleChannel, handleRefresh, handleToggleQueuePause, runningTasks, queuePaused, deadCount, loaded, lastUpdated, refreshError, updatingPriority, runningDuration, isSelectable, queue, designerId, designers, filteredQueue, selectedRows, clearSelection, openBatchPriorityDialog, priorityValue, submitPriority, priorityTargetRows, priorityDialogVisible, batchFailureSummary };`)(...Object.values(context))
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

test('refresh reads all running tasks and actual global pause state', async () => {
  const state = setup(undefined, {
    getRunningProductPackagingTasks: async () => ({ code: 0, data: [row(4, 10), row(5, 20)] }),
    getProductPackagingQueuePause: async () => ({ code: 0, data: true }),
    getProductPackagingDeadQueue: async () => ({ code: 0, data: [row(6, 10)] })
  })
  await state.handleRefresh()
  assert.equal(state.runningTasks.value.length, 2)
  assert.equal(state.queuePaused.value, true)
  assert.equal(state.deadCount.value, 1)
  assert.equal(state.loaded.value, true)
  assert.equal(state.isSelectable(row(5, 20)), false)
})
test('partial refresh failure preserves previous snapshot and timestamp', async () => {
  let fail = false
  const state = setup(undefined, {
    getProductPackagingQueuePause: async () => ({ code: fail ? 1 : 0, data: true })
  })
  await state.handleRefresh()
  const updated = state.lastUpdated.value
  state.queue.value = [row(1, 10)]
  fail = true
  await state.handleRefresh()
  assert.equal(state.queue.value.length, 1)
  assert.equal(state.queuePaused.value, true)
  assert.equal(state.lastUpdated.value, updated)
  assert.match(state.refreshError.value, /刷新失败/)
})
test('pause failure retains server state and refresh is suspended during editing', async () => {
  const state = setup(undefined, {
    setProductPackagingQueuePause: async () => ({ code: 1 })
  })
  await state.handleToggleQueuePause(true)
  assert.equal(state.queuePaused.value, false)
  state.lastUpdated.value = null
  state.priorityDialogVisible.value = true
  await state.handleRefresh()
  assert.equal(state.lastUpdated.value, null)
})
test('duration uses reported start time and handles missing or invalid starts', () => {
  const state = setup()
  state.lastUpdated.value = 120000
  assert.equal(state.runningDuration({ processingStartedAt: 30000 }), '1 分 30 秒')
  assert.equal(state.runningDuration({}), '待上报')
  assert.equal(state.runningDuration({ processingStartedAt: 'bad' }), '待上报')
})


test('channel switches send inverse pause flag without changing other queues', async () => {
  const channels = [{ queueId: 'prod-pack-n01-01', paused: false }, { queueId: 'prod-pack-n02-01', paused: false }]
  const calls = []
  const state = setup(undefined, {
    getPackagingChannels: async () => ({ code: 0, data: channels }),
    setPackagingChannelPause: async (id, paused) => { calls.push([id, paused]); return { code: 0 } }
  })
  await state.handleRefresh()
  await state.handleToggleChannel(channels[0], false)
  assert.deepEqual(calls, [['prod-pack-n01-01', true]])
  assert.equal(channels[0].paused, true)
  assert.equal(channels[1].paused, false)
  await state.handleToggleChannel(channels[0], true)
  assert.deepEqual(calls[1], ['prod-pack-n01-01', false])
})

test('failed channel toggle retains last confirmed state', async () => {
  const channel = { queueId: 'prod-pack-n01-01', paused: true }
  const state = setup(undefined, {
    getPackagingChannels: async () => ({ code: 0, data: [channel] }),
    setPackagingChannelPause: async () => { throw new Error('offline') }
  })
  await state.handleRefresh()
  await state.handleToggleChannel(channel, true)
  assert.equal(state.channels.value[0].paused, true)
})

test('global allow switch sends paused false', async () => {
  const calls = []
  const state = setup(undefined, {
    setProductPackagingQueuePause: async paused => { calls.push(paused); return { code: 0 } }
  })
  await state.handleToggleQueuePause(true)
  await state.handleToggleQueuePause(false)
  assert.deepEqual(calls, [false, true])
})
