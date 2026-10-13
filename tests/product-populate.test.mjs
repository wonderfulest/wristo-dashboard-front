import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function loadApi() {
  const calls = []
  const instance = Object.fromEntries(['get', 'post', 'delete'].map(method => [method, (...args) => {
    calls.push({ method, args })
    return Promise.resolve({ code: 0 })
  }]))
  const source = readFileSync(new URL('../src/api/products.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } })
  const exports = {}
  vm.runInNewContext(outputText, { exports, require: () => ({ default: instance }) })
  return { api: exports, calls }
}

test('product page sends only requested associations in query parameters, preserving filters', async () => {
  const { api, calls } = loadApi()
  const query = { pageNum: 1, pageSize: 20, status: 1, populate: 'user', lastGoLiveStart: '2026-09-15 00:00:00' }
  await api.fetchProductPage(query)
  const [url, body, config] = calls[0].args
  assert.equal(url, '/admin/products/page')
  assert.equal(config.params.populate, 'user')
  assert.equal(body.populate, undefined)
  assert.equal(body.lastGoLiveStart, query.lastGoLiveStart)
  assert.equal(body.status, 1)
  assert.equal(query.populate, 'user')
})

test('product selectors do not expand associations by default', async () => {
  const { api, calls } = loadApi()
  await api.fetchProductPage({ pageNum: 1, pageSize: 1000 })
  const [url, , config] = calls[0].args
  assert.equal(url, '/admin/products/page')
  assert.ok(!config?.params?.populate)
})

test('packaging defaults load product and author while count requests allow no expansion', async () => {
  const { api, calls } = loadApi()
  await api.getProductPackagingQueue()
  await api.getProductPackagingDeadQueue()
  await api.getRunningProductPackagingTasks()
  await api.getProductPackagingQueue('')
  assert.deepEqual(calls.map(call => call.args[1].params.populate), ['product,user', 'product,user', 'product,user', ''])
})
