import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../src/views/ops/PointsAccounts.vue', import.meta.url), 'utf8')
const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const code = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText
const ok = data => ({ code: 0, data })
function setup(overrides = {}) {
  const requests = []
  let id = 0
  const context = {
    ref: value => ({ value }), computed: getter => ({ get value() { return getter() } }), watch() {}, onBeforeUnmount() {}, onBeforeRouteLeave() {}, onBeforeRouteUpdate() {},
    useRoute: () => ({ query: { userId: '7' } }), useRouter: () => ({ replace() {}, push() {} }),
    window: { addEventListener() {}, removeEventListener() {} }, crypto: { randomUUID: () => `request-${++id}` },
    ElMessage: { warning() {}, success() {} }, ElMessageBox: { confirm: async () => {} },
    getRewardAccount: async userId => ok({ userId, balance: 30, available: 30, debt: 0 }), getRewardHistory: async () => ok({ items: [], total: 0 }),
    getCreditAccount: async () => ok({ balance: 42 }), getCreditHistory: async () => ok({ items: [], total: 0 }),
    adjustRewardPoints: async (...args) => { requests.push(args); return ok({ balance: 31 }) },
    ...overrides,
  }
  const state = new Function(...Object.keys(context), `${code}; return { userId, load, loadAi, refreshAll, account, aiBalance, error, aiError, submit, pending, reason, saving, amount, blocked, allowNavigation };`)(...Object.values(context))
  return { ...state, requests }
}

test('AI 点数读取失败不会丢失已成功读取的奖励积分，也不会显示为零', async () => {
  const state = setup({ getCreditAccount: async () => { throw new Error('offline') } })
  await state.refreshAll()
  assert.equal(state.account.value.available, 30)
  assert.equal(state.aiBalance.value, undefined)
  assert.match(state.aiError.value, /无法读取 AI 点数/)
  assert.equal(state.error.value, '')
})

test('切换用户时忽略旧账户响应', async () => {
  let finishFirst
  const state = setup({ getRewardAccount: userId => userId === 7 ? new Promise(resolve => { finishFirst = resolve }) : Promise.resolve(ok({ userId, balance: 90 })) })
  const first = state.load()
  state.userId.value = 8
  await state.load()
  finishFirst(ok({ userId: 7, balance: 30 }))
  await first
  assert.equal(state.account.value.userId, 8)
  assert.equal(state.account.value.balance, 90)
})

test('结果不确定时保留同一个调整请求且阻止离开，重试成功后解除', async () => {
  const calls = []
  const state = setup({ adjustRewardPoints: async (userId, body) => {
    calls.push({ userId, body: { ...body } })
    if (calls.length === 1) throw new Error('response lost')
    return ok({ balance: 31 })
  } })
  state.reason.value = '补偿'
  await state.submit()
  assert.equal(state.allowNavigation(), false)
  assert.equal(state.pending.value.id, 7)
  await state.submit()
  assert.deepEqual(calls[0], calls[1])
  assert.equal(state.pending.value, undefined)
  assert.equal(state.allowNavigation(), true)
})

test('重复点击确认不会重复发起调整', async () => {
  let confirm
  const state = setup({ ElMessageBox: { confirm: () => new Promise(resolve => { confirm = resolve }) } })
  state.reason.value = '补偿'
  const first = state.submit()
  await state.submit()
  assert.equal(state.requests.length, 0)
  confirm()
  await first
  assert.equal(state.requests.length, 1)
})

const dialogSource = fs.readFileSync(new URL('../src/components/users/StudioCreditsDialog.vue', import.meta.url), 'utf8')
const dialogScript = dialogSource.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
const dialogCode = ts.transpileModule(dialogScript, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText
function setupDialog(overrides = {}) {
  const events = [], requests = []
  const context = {
    ref: value => ({ value }), reactive: value => value, computed: getter => ({ get value() { return getter() } }), watch() {}, onBeforeUnmount() {}, onBeforeRouteLeave() {}, onBeforeRouteUpdate() {},
    defineProps: () => ({}), defineEmits: () => (...event) => events.push(event), defineExpose() {},
    window: { addEventListener() {}, removeEventListener() {} }, crypto: { randomUUID: () => 'ai-request-1' },
    ElMessage: { warning() {}, success() {} }, ElMessageBox: { confirm: async () => {} },
    reasons: { PLATFORM_GIFT: '平台赠送' }, types: {},
    getCreditAccount: async () => ok({ balance: 42 }), getCreditHistory: async () => ok({ items: [], total: 0 }),
    adjustCredits: async (...args) => { requests.push(args); return ok({ balance: 142 }) }, ...overrides,
  }
  const state = new Function(...Object.keys(context), `${dialogCode}; return { userId, balance, form, submit, uncertain, allowNavigation };`)(...Object.values(context))
  state.userId.value = 7; state.balance.value = 42
  return { ...state, events, requests }
}

test('AI 人工调整默认平台赠送，成功通知账户页面更新', async () => {
  const state = setupDialog()
  assert.equal(state.form.reason, 'PLATFORM_GIFT')
  await state.submit()
  assert.deepEqual(state.events, [['updated', 7]])
  assert.equal(state.requests[0][1].reason, 'PLATFORM_GIFT')
})

test('AI 未确认响应保留请求编号，重试成功前阻止离开', async () => {
  const calls = []
  const state = setupDialog({ adjustCredits: async (id, body) => {
    calls.push({ id, body: { ...body } })
    if (calls.length === 1) throw new Error('network')
    return ok({ balance: 142 })
  } })
  await state.submit()
  assert.equal(state.uncertain.value, true)
  assert.equal(state.allowNavigation(), false)
  await state.submit()
  assert.deepEqual(calls[0], calls[1])
  assert.equal(state.allowNavigation(), true)
  assert.deepEqual(state.events, [['updated', 7]])
})
