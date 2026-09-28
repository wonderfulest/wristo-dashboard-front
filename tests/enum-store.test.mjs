import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
import { createPinia, defineStore, setActivePinia } from 'pinia'

async function createStore(request) {
  const source = await readFile(new URL('../src/store/common.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source.replace(/^import .*$/gm, ''), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const context = { exports: {}, defineStore, listEnumOptions: request, sessionStorage: {} }
  vm.runInNewContext(code, context)
  setActivePinia(createPinia())
  return context.exports.useEnumStore()
}

const options = [{ name: 'TIME_FONT', value: 'time_font' }]

test('concurrent font dropdowns wait for the same request', async () => {
  let resolve
  let calls = 0
  const store = await createStore(() => {
    calls++
    return new Promise(r => { resolve = r })
  })
  const upload = store.getEnumOptions('DesignFontType')
  const filter = store.getEnumOptions('DesignFontType')
  await Promise.resolve()
  resolve({ data: options })
  const results = await Promise.all([upload, filter])
  assert.equal(calls, 1)
  for (const result of results) assert.equal(JSON.stringify(result), JSON.stringify(options))
})

test('empty persisted options are fetched again', async () => {
  const store = await createStore(async () => ({ data: options }))
  store.options.DesignFontType = []
  store.loaded.DesignFontType = true
  assert.equal(JSON.stringify(await store.getEnumOptions('DesignFontType')), JSON.stringify(options))
})

test('failed requests can be retried', async () => {
  let calls = 0
  const store = await createStore(async () => {
    if (++calls === 1) throw new Error('offline')
    return { data: options }
  })
  await store.getEnumOptions('DesignFontType')
  assert.equal(store.error.DesignFontType, 'offline')
  assert.equal(JSON.stringify(await store.getEnumOptions('DesignFontType')), JSON.stringify(options))
})
