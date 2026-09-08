import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('../src/views/ops/FeatureSwitches.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const js = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
const feature = { key: 'payment-checkout', name: '支付发起', enabled: true, version: 3 }
function page(api = {}) {
  const context = vm.createContext({
    ref: value => ({ value }), onMounted: () => {}, ElMessage: { success() {}, warning() {} },
    getFeatureSwitches: async () => ({ data: [feature] }),
    updateFeatureSwitch: async () => { throw new Error('unexpected update') },
    getFeatureSwitchHistory: async () => ({ data: [] }), ...api,
  })
  vm.runInContext(`${js}\nthis.page = {load, save, openChange, openHistory, features, loadError, selected, reason, reasonError, saving, histories, historyError}`, context)
  return context.page
}
test('failed refresh clears old state and blocks stale operations', async () => {
  let fail = false
  const p = page({ getFeatureSwitches: async () => { if (fail) throw Error('network'); return { data: [feature] } } })
  await p.load(); assert.equal(p.features.value.length, 1)
  fail = true; await p.load()
  assert.equal(p.features.value.length, 0); assert.ok(p.loadError.value)
})
test('reason is required and change is applied only after confirmed response', async () => {
  let finish, payload
  const p = page({ updateFeatureSwitch: (key, data) => { payload = { key, ...data }; return new Promise(resolve => { finish = resolve }) } })
  await p.load(); p.openChange(feature)
  p.reason.value = '  '; await p.save(); assert.ok(p.reasonError.value); assert.equal(payload, undefined)
  p.reason.value = ' maintenance '; const saving = p.save()
  assert.equal(p.features.value[0].enabled, true); assert.equal(p.saving.value, true)
  assert.equal(payload.version, 3); assert.equal(payload.enabled, false); assert.equal(payload.reason, 'maintenance')
  finish({ data: { ...feature, enabled: false, version: 4 } }); await saving
  assert.equal(p.features.value[0].enabled, false); assert.equal(p.saving.value, false)
})
test('uncertain update reloads authoritative state without retrying mutation', async () => {
  let calls = 0
  const p = page({ getFeatureSwitches: async () => ({ data: [{ ...feature, enabled: false, version: 4 }] }), updateFeatureSwitch: async () => { calls++; throw Error('response lost') } })
  p.openChange(feature); p.reason.value = 'maintenance'; await p.save()
  assert.equal(calls, 1); assert.equal(p.features.value[0].version, 4)
})
test('late history response cannot overwrite another selected feature', async () => {
  const resolves = {}
  const p = page({ getFeatureSwitchHistory: key => new Promise(resolve => { resolves[key] = resolve }) })
  const first = p.openHistory(feature); const second = p.openHistory({ ...feature, key: 'email-delivery' })
  resolves['email-delivery']({ data: [{ id: 2 }] }); await second
  resolves['payment-checkout']({ data: [{ id: 1 }] }); await first
  assert.equal(p.histories.value[0].id, 2)
})
