import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source = fs.readFileSync(new URL('../src/components/PointsRechargeSettings.vue', import.meta.url), 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const original = { enabled: true, pointsPerYuan: 10, plans: [10, 60, 180, 300, 680].map(points => ({ points })) }
function setup({ get, put } = {}) {
  const writes = [], reads = [], warnings = []
  const context = { ref: value => ({ value }), onMounted() {}, ElMessage: { warning: m => warnings.push(m), success() {} },
    getPointsRechargeConfig: async () => { reads.push(1); return get ? get(reads.length) : { code: 0, data: original } },
    savePointsRechargeConfig: async data => { writes.push(data); return put ? put(data) : { code: 0 } },
  }
  return { ...new Function(...Object.keys(context), `${code}; return { settings, loading, saving, error, load, save, validate, addPlan };`)(...Object.values(context)), writes, reads, warnings }
}
test('server plans load without local defaults and save refreshes server state', async () => {
  const s = setup()
  await s.load()
  assert.deepEqual(s.settings.value, original)
  s.settings.value.plans[0].points = 20
  assert.equal(original.plans[0].points, 10)
  await s.save()
  assert.equal(s.writes[0].pointsPerYuan, 10)
  assert.equal(s.writes[0].plans[0].points, 20)
  assert.equal(s.reads.length, 2)
  assert.equal(s.settings.value.plans[0].points, 10)
})
test('read failure supplies no fallback and prevents save', async () => {
  const s = setup({ get: () => { throw new Error() } })
  await s.load(); await s.save()
  assert.equal(s.settings.value, undefined)
  assert.ok(s.error.value)
  assert.equal(s.writes.length, 0)
})
test('uncertain write blocks retries until explicit refresh', async () => {
  const s = setup({ put: () => { throw new Error() } })
  await s.load(); await s.save(); await s.save()
  assert.equal(s.writes.length, 1)
  assert.ok(s.error.value)
  await s.load()
  assert.equal(s.error.value, '')
})
test('invalid points, duplicate plans, limits, enabled empty and ratio are rejected', async () => {
  const s = setup()
  for (const points of [0, 9, 11, 10.5, 100010, NaN, undefined]) {
    s.settings.value = { ...original, plans: [{ points }] }
    await s.save()
  }
  for (const config of [
    { ...original, pointsPerYuan: 20 },
    { ...original, plans: [] },
    { ...original, plans: [{ points: 10 }, { points: 10 }] },
    { ...original, plans: Array.from({ length: 21 }, (_, i) => ({ points: (i + 1) * 10 })) },
  ]) { s.settings.value = config; await s.save() }
  assert.equal(s.writes.length, 0)
  assert.equal(s.validate({ enabled: false, pointsPerYuan: 10, plans: [] }), '')
})
test('post-save refresh failure clears stale form and blocks further writes', async () => {
  const s = setup({ get: count => { if (count > 1) throw new Error(); return { code: 0, data: original } } })
  await s.load(); await s.save(); await s.save()
  assert.equal(s.settings.value, undefined)
  assert.ok(s.error.value)
  assert.equal(s.writes.length, 1)
})
