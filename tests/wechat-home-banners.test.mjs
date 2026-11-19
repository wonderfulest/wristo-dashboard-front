import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source = fs.readFileSync(new URL('../src/components/ops/WechatHomeBanners.vue', import.meta.url), 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
function setup(failLoad = false) {
  let mount
  const writes = []
  const context = {
    ref: value => ({ value }), computed: fn => ({ get value() { return fn() } }), onMounted: fn => { mount = fn },
    ElMessage: { success() {}, warning() {}, error() {} },
    instance: {
      get: async url => {
        if (failLoad) throw new Error('offline')
        if (url.includes('/candidate/')) return { code: 0, data: { appId: Number(url.split('/').pop()), bannerImageUrl: 'https://example.com/banner.png' } }
        return { code: 0, data: { enabled: true, appIds: [101, 102] } }
      },
      put: async (url, body) => { writes.push({ url, body }); return { code: 0, data: body } },
    },
  }
  const state = new Function(...Object.keys(context), `${code}; return { items, appId, enabled, add, move, save, canSave, adding };`)(...Object.values(context))
  return { ...state, mount: () => mount(), writes }
}
test('WeChat banner configuration saves selected order and allows clearing without touching iOS', async () => {
  const state = setup()
  await state.mount()
  state.move(1, -1)
  state.appId.value = 103
  await state.add()
  await state.save()
  assert.deepEqual(state.writes[0], { url: '/admin/website/wechat-home-banners', body: { enabled: true, appIds: [102, 101, 103] } })
  state.items.value = []
  assert.equal(state.canSave.value, false)
  state.enabled.value = false
  await state.save()
  assert.deepEqual(state.writes[1].body, { enabled: false, appIds: [] })
})
test('load failure and in-flight candidate lookup cannot overwrite banner settings', async () => {
  const state = setup(true)
  await state.mount()
  await state.save()
  assert.equal(state.writes.length, 0)
  const loaded = setup()
  await loaded.mount()
  loaded.adding.value = true
  await loaded.save()
  assert.equal(loaded.writes.length, 0)
})
test('duplicate selection is ignored and removal is reflected on save', async () => {
  const state = setup()
  await state.mount()
  state.appId.value = 101
  await state.add()
  assert.equal(state.items.value.length, 2)
  state.items.value.splice(0, 1)
  await state.save()
  assert.deepEqual(state.writes[0].body.appIds, [102])
})
