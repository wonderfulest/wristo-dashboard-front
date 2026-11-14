import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const transpile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const helpers = await import(`data:text/javascript;base64,${Buffer.from(transpile(fs.readFileSync(new URL('../src/utils/configSnapshot.ts', import.meta.url), 'utf8'))).toString('base64')}`)
const source = fs.readFileSync(new URL('../src/components/CnRewardAmountsSettings.vue', import.meta.url), 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const code = transpile(source)
const original = { checkInPoints: 10, trialPoints: 10, trialDailyLimit: 20, referralPoints: 30, monthlyCap: 60, defaultRedemptionPoints: 50, productPoints: { 123: 40 } }
function setup(saveResponse) {
  const writes = [], reads = []
  const context = { ref: value => ({ value }), onMounted() {}, ElMessage: { warning() {}, success() {} },
    getCnRewardAmounts: async () => { reads.push(1); return { code: 0, data: { settings: original, version: 7, initialized: true } } },
    saveCnRewardAmounts: async (data, version) => { writes.push({ data, version }); if (saveResponse) return saveResponse(data, version); return { code: 0, data: { settings: data, version: version + 1, initialized: true } } },
  }
  const state = new Function(...Object.keys(context), `${code}; return { apply, settings, save, error };`)(...Object.values(context))
  state.apply({ settings: original, version: 7, initialized: true })
  return { ...state, writes, reads }
}
test('配置对象键顺序不影响可读差异比较', () => {
  assert.equal(helpers.configSnapshot({ a: 1, b: { x: 2, y: 3 } }), helpers.configSnapshot({ b: { y: 3, x: 2 }, a: 1 }))
})
test('版本冲突保留国内配置草稿，不自动刷新或以新版本重试', async () => {
  const state = setup(async () => { throw { code: 409, msg: '配置已被其他管理员修改' } })
  state.settings.value.checkInPoints = 15
  await state.save()
  assert.equal(state.writes.length, 1)
  assert.equal(state.writes[0].version, 7)
  assert.equal(state.settings.value.checkInPoints, 15)
  assert.equal(state.reads.length, 0)
  assert.match(state.error.value, /其他管理员修改/)
  await state.save()
  assert.equal(state.writes[1].version, 7)
})
test('缺失服务端版本时拒绝写入，首次创建显式发送版本零', async () => {
  const state = setup()
  state.apply({ settings: original, initialized: true })
  await state.save()
  assert.equal(state.writes.length, 0)
  assert.match(state.error.value, /缺少配置版本/)
  state.apply({ settings: original, version: 0, initialized: false })
  await state.save()
  assert.equal(state.writes[0].version, 0)
})
test('保存完整国内配置保留覆盖和兑换额度，后续保存使用返回版本', async () => {
  const state = setup()
  state.settings.value.checkInPoints = 15
  await state.save()
  assert.deepEqual(state.writes[0], { data: { ...original, checkInPoints: 15 }, version: 7 })
  state.settings.value.checkInPoints = 16
  await state.save()
  assert.equal(state.writes[1].version, 8)
})

// Load the formatter with the same stable comparison used by settings preflight checks.
const changeSource = fs.readFileSync(new URL('../src/utils/configChanges.ts', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replaceAll('export ', '')
const changes = new Function('configSnapshot', `${transpile(changeSource)}; return configChanges;`)(helpers.configSnapshot)
test('修改历史只展示变化字段，并正确区分关闭、空值和删除', () => {
  assert.deepEqual(changes('{"enabled":true,"checkInCredits":10,"startsAt":"2026-01-01","endsAt":null}', '{"enabled":false,"checkInCredits":10,"startsAt":null}'), [
    { field: '启用', before: '开启', after: '关闭' },
    { field: '开始时间', before: '2026-01-01', after: '空' },
    { field: '结束时间', before: '空', after: '未设置' },
  ])
})
test('修改历史兼容旧非 JSON 记录，不会因解析失败丢失原文', () => {
  assert.deepEqual(changes('old text', 'new text'), [{ field: '配置', before: 'old text', after: 'new text' }])
})

const aiSource = fs.readFileSync(new URL('../src/views/ops/StudioAiModels.vue', import.meta.url), 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const aiCode = transpile(aiSource)
function setupAi() {
  const writes = [], reads = []
  const settings = { enabled: true, models: [{ id: 'text', provider: 'OPENAI', model: 'text-model', capability: 'TEXT', enabled: true }, { id: 'image', provider: 'OPENAI', model: 'image-model', capability: 'IMAGE', enabled: true }], scenes: Object.fromEntries(['WATCHFACE', 'WATCHFACE_ADJUST', 'TAGS', 'DESCRIPTION', 'BANNER'].map(key => [key, { enabled: true, modelId: key === 'BANNER' ? 'image' : 'text', creditCost: 5 }])) }
  const context = { ref: value => ({ value }), onMounted() {}, defineProps: () => ({mode: 'models'}), ElMessage: { warning() {}, success() {} },
    getStudioAi: async () => { reads.push(1); throw new Error('must not refresh during save') },
    saveStudioAi: async (data, version) => { writes.push({ data, version }); throw { response: { data: { code: 409, msg: '模型配置版本冲突' } } } },
  }
  const state = new Function(...Object.keys(context), `${aiCode}; return { apply, settings, save, error };`)(...Object.values(context))
  state.apply({ settings, credentials: {}, active: true, version: 3 })
  return { ...state, writes, reads }
}
test('模型场景保存携带读取版本，409 时保留场景改动并且不自动重试', async () => {
  const state = setupAi()
  state.settings.value.scenes.WATCHFACE.creditCost = 20
  await state.save()
  assert.equal(state.writes.length, 1)
  assert.equal(state.writes[0].version, 3)
  assert.equal(state.settings.value.scenes.WATCHFACE.creditCost, 20)
  assert.equal(state.reads.length, 0)
  assert.match(state.error.value, /版本冲突/)
})
