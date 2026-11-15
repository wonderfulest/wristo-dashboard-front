import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { parse, compileScript } from '@vue/compiler-sfc'
import * as vue from 'vue'
import ts from 'typescript'
import { searchApps } from '../src/utils/appSearch.ts'

function setup(file, props, api = {}) {
  const { descriptor } = parse(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'))
  const script = compileScript(descriptor, { id: 'test' }).content
  const { outputText } = ts.transpileModule(script, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  const exports = {}, timers = new Map(), events = [], cleanup = []
  let nextTimer = 0
  vm.runInNewContext(outputText, {
    exports,
    setTimeout: fn => { const id = ++nextTimer; timers.set(id, fn); return id },
    clearTimeout: id => timers.delete(id),
    require: name => name === 'vue' ? { ...vue, onMounted: () => {}, onBeforeUnmount: fn => cleanup.push(fn) }
      : name === '@/utils/appSearch' ? { searchApps }
      : name === 'element-plus' ? { ElMessage: { warning() {}, error() {}, success() {} } } : api,
  })
  const state = exports.default.setup(props, { expose() {}, emit: (...args) => events.push(args) })
  return { state, events, cleanup, runTimer: () => { const [id, fn] = timers.entries().next().value; timers.delete(id); return fn() } }
}
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
const response = (appId) => ({ code: 0, data: { appId, name: `App ${appId}` } })

test('parent reset invalidates a pending selected event', async () => {
  const pending = deferred()
  const props = vue.reactive({ modelValue: undefined })
  const { state, events } = setup('components/common/AppSearchSelect.vue', props, { getProduct: () => pending.promise })
  props.modelValue = 123
  const selecting = state.onChange(123)
  props.modelValue = undefined
  await vue.nextTick()
  pending.resolve(response(123))
  await selecting
  assert.equal(events.filter(([name]) => name === 'selected').length, 0)
})

test('latest name search wins and clearing invalidates in-flight results', async () => {
  const calls = [], pending = []
  const { state, runTimer, cleanup } = setup('components/common/AppSearchSelect.vue', vue.reactive({ modelValue: undefined }), {
    fetchProductPage: query => { calls.push(query); const request = deferred(); pending.push(request); return request.promise },
  })
  state.onRemote(' old ')
  const first = runTimer()
  state.onRemote('new')
  const second = runTimer()
  pending[1].resolve({ code: 0, data: { list: [response(2).data] } })
  await second
  pending[0].resolve({ code: 0, data: { list: [response(1).data] } })
  await first
  assert.equal(state.matches.value[0].appId, 2)
  assert.equal(calls[0].name, 'old')
  state.onRemote('last')
  const third = runTimer()
  state.onRemote('')
  pending[2].resolve({ code: 0, data: { list: [response(3).data] } })
  await third
  assert.equal(state.matches.value.length, 0)
  assert.equal(state.loading.value, false)
  cleanup.forEach(fn => fn())
})

test('single-app compute without a selection never runs all applications', async () => {
  const calls = []
  const { state } = setup('views/meter/MeterOperation.vue', {}, {
    triggerComputeAll: async () => calls.push('all'),
    triggerCompute: async id => calls.push(id),
  })
  await state.handleCompute()
  assert.deepEqual(calls, [])
  state.computeAppId.value = 123
  await state.handleCompute()
  assert.deepEqual(calls, ['123'])
})
