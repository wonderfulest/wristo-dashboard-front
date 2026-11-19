import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source = fs.readFileSync(new URL('../src/components/ops/WatchfacePushConfig.vue', import.meta.url), 'utf8')
  .match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
function setup({ failFirstSend = false, failLoad = false, cancel = false } = {}) {
  let mount, sequence = 0
  const writes = []
  const config = { enabled: true, sendTime: '09:00', templateId: 'template', source: 'Wristo', selectionMode: 'MANUAL', appId: 42 }
  const context = {
    ref: value => ({ value }), reactive: value => value, onMounted: fn => { mount = fn },
    crypto: { randomUUID: () => `request-${++sequence}` },
    ElMessage: { success() {}, warning() {}, error() {} },
    ElMessageBox: { confirm: async () => { if (cancel) throw 'cancel' } },
    getWatchfacePushSettings: async () => { if (failLoad) throw new Error('offline'); return { code: 0, data: { ...config } } },
    getWatchfacePushHistory: async () => ({ code: 0, data: [] }),
    saveWatchfacePushSettings: async () => { throw new Error('An immediate task must not save scheduled configuration') },
    sendWatchfacePushNow: async (id, settings) => {
      writes.push({ id, settings })
      if (failFirstSend && writes.length === 1) throw new Error('Response lost')
      return { code: 0, data: { requestId: id } }
    },
  }
  const state = new Function(...Object.keys(context), `${code}; return { sendNow, manualAppId, form, sending };`)(...Object.values(context))
  return { ...state, mount: () => mount(), writes }
}
test('same-day manual tasks receive distinct identities without changing the saved schedule', async () => {
  const state = setup(); await state.mount()
  await state.sendNow(); await state.sendNow()
  assert.equal(state.writes.length, 2)
  assert.notEqual(state.writes[0].id, state.writes[1].id)
  assert.equal(state.writes[0].settings.appId, 42)
})
test('an uncertain response retries the same task ID instead of creating duplicate notifications', async () => {
  const state = setup({ failFirstSend: true }); await state.mount()
  await state.sendNow(); await state.sendNow(); await state.sendNow()
  assert.equal(state.writes[0].id, state.writes[1].id)
  assert.notEqual(state.writes[1].id, state.writes[2].id)
})
test('failed loading, cancellation and simultaneous clicks never submit unintended extra tasks', async () => {
  const failed = setup({ failLoad: true }); await failed.mount(); await failed.sendNow()
  assert.equal(failed.writes.length, 0)
  const cancelled = setup({ cancel: true }); await cancelled.mount(); await cancelled.sendNow()
  assert.equal(cancelled.writes.length, 0)
  const state = setup(); await state.mount()
  await Promise.all([state.sendNow(), state.sendNow()])
  assert.equal(state.writes.length, 1)
})
