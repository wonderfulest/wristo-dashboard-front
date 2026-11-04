import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

for (const [page, api, fetch, flag] of [
  ['PackagingLogs', 'clearFinishedProductPackagingLogs', 'fetchPackagingLogs', 'clearing'],
  ['PackagingDeadQueue', 'clearProductPackagingDeadQueue', 'fetchDeadQueue', 'deleting']
]) {
  const source = fs.readFileSync(new URL(`../src/views/dashboard/packaging/${page}.vue`, import.meta.url), 'utf8')
  const handler = source.slice(source.indexOf('const clearAll ='), source.indexOf('const handleSelectionChange'))
  function setup({ cancel = false, code = 0 } = {}) {
    let calls = 0, refreshes = 0
    const messages = []
    const busy = { value: false }
    const currentPage = { value: 5 }
    const context = {
      [flag]: busy, loading: { value: false }, submittingRequeue: { value: false }, currentPage,
      ElMessageBox: { confirm: async () => { if (cancel) throw 'cancel' } },
      ElMessage: { success: value => messages.push(['success', value]), error: value => messages.push(['error', value]) },
      [api]: async (...args) => { assert.deepEqual(args, []); calls++; return { code, data: 25 } },
      [fetch]: async () => { refreshes++ }
    }
    const clearAll = new Function(...Object.keys(context), `${handler}; return clearAll`)(...Object.values(context))
    return { clearAll, busy, currentPage, messages, get calls() { return calls }, get refreshes() { return refreshes } }
  }
  test(`${page}: cancellation does not mutate or refresh`, async () => {
    const s = setup({ cancel: true }); await s.clearAll()
    assert.equal(s.calls, 0); assert.equal(s.refreshes, 0); assert.equal(s.busy.value, false)
  })
  test(`${page}: clears globally once and refreshes, guarding concurrent clicks`, async () => {
    const s = setup(); await Promise.all([s.clearAll(), s.clearAll()])
    assert.equal(s.calls, 1); assert.equal(s.refreshes, 1)
    assert.deepEqual(s.messages, [['success', '已清空 25 条']])
    if (page === 'PackagingLogs') assert.equal(s.currentPage.value, 1)
    assert.equal(s.busy.value, false)
  })
  test(`${page}: API error releases busy state without reporting success`, async () => {
    const s = setup({ code: 1 }); await s.clearAll()
    assert.equal(s.refreshes, 0); assert.equal(s.messages[0][0], 'error'); assert.equal(s.busy.value, false)
  })
}
