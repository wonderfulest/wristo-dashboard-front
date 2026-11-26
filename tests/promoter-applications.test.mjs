import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import ts from 'typescript'

const view = readFileSync(new URL('../src/views/marketing/PromoterApplications.vue', import.meta.url), 'utf8')
const script = view.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const { outputText } = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022 } })

function setup(reviewApplication) {
  const calls = []
  const init = new Function('ref', 'onMounted', 'getApplications', 'reviewApplication', 'ElMessage',
    outputText + '\nreturn { status, openReview, reason, visible, submit, load }')
  const state = init(value => ({ value }), () => {}, async (...args) => {
    calls.push(args)
    return { data: { records: [], total: 0 } }
  }, reviewApplication, { success() {} })
  return { ...state, calls }
}

test('rejection requires a reason and reloads the pending list', async () => {
  const writes = []
  const app = setup(async (...args) => writes.push(args))
  app.openReview({ id: 9 }, false)
  app.reason.value = ' '
  await app.submit()
  assert.deepEqual(writes, [])
  app.reason.value = '  请补充资料 '
  await app.submit()
  assert.deepEqual(writes, [[9, false, '请补充资料']])
  assert.deepEqual(app.calls, [[1, 20, 'pending']])
  assert.equal(app.visible.value, false)
})

test('duplicate approval submits only once', async () => {
  let finish
  const writes = []
  const app = setup((...args) => {
    writes.push(args)
    return new Promise(resolve => { finish = resolve })
  })
  app.openReview({ id: 3 }, true)
  const pending = app.submit()
  await app.submit()
  assert.deepEqual(writes, [[3, true, '']])
  finish()
  await pending
  assert.equal(app.visible.value, false)
})
