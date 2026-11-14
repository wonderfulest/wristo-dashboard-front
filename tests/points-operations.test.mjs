import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const transpile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const source = fs.readFileSync(new URL('../src/utils/pointsOperationsQuery.ts', import.meta.url), 'utf8')
const query = await import(`data:text/javascript;base64,${Buffer.from(transpile(source)).toString('base64')}`)
const now = new Date('2026-11-14T17:00:00Z') // 15th in Shanghai

test('查询默认按北京时间30天，不受执行机器时区影响', () => {
  assert.deepEqual(query.operationsRange(30, now), ['2026-10-17', '2026-11-15'])
  assert.deepEqual(query.parseOperationsQuery({}, 'ledger', now), { from: '2026-10-17', to: '2026-11-15', page: 1, pageSize: 20 })
})
test('非法日期、未来日期、超过366天和重复参数不发请求', () => {
  for (const values of [{ from: '2026-02-30' }, { to: '2026-11-16' }, { from: '2025-11-14' }, { page: '10001' }, { pageSize: '1000' }, { userId: '9223372036854775808' }, { asset: ['AI', 'REWARD'] }]) {
    assert.throws(() => query.parseOperationsQuery(values, 'ledger', now))
  }
  assert.doesNotThrow(() => query.parseOperationsQuery({ from: '2025-11-15' }, 'ledger', now))
})
test('精确编号与关键词分别保留，大用户ID不经浮点转换', () => {
  const parsed = query.parseOperationsQuery({ userId: '9007199254740993', eventKey: 'redeem:WRP1', keyword: '50%_reward', source: 'CN_BRIDGE', asset: 'REWARD' }, 'ledger', now)
  assert.equal(parsed.userId, '9007199254740993')
  assert.equal(parsed.eventKey, 'redeem:WRP1')
  assert.equal(parsed.keyword, '50%_reward')
  assert.equal(parsed.source, undefined)
})
test('兑换页URL保持查询状态及记录页签，不携带其他域字段', () => {
  const parsed = query.parseOperationsQuery({ id: 'WRP123', source: 'MINIAPP', kind: 'RESOURCE', asset: 'AI', page: '2' }, 'redemptions', now)
  const encoded = query.operationsRouteQuery(parsed, 'redemptions')
  assert.equal(encoded.tab, 'records'); assert.equal(encoded.id, 'WRP123'); assert.equal(encoded.page, '2'); assert.equal(encoded.asset, undefined)
})
test('兑换反查精确事件编号与北京时间日期，避免默认30天漏掉旧兑换', () => {
  assert.deepEqual(query.redemptionLedgerQuery({ userId: '123', eventKey: 'cn:redeem:WRPold', createdAt: '2025-01-01T18:00:00Z' }), {
    userId: '123', asset: 'REWARD', eventKey: 'cn:redeem:WRPold', from: '2025-01-02', to: '2025-01-02',
  })
})
const composableSource = fs.readFileSync(new URL('../src/composables/usePointsOperations.ts', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replace('export function', 'function')
const composableCode = transpile(composableSource)
function setup(fetch) {
  const route = { path: '/ops/points-ledger', fullPath: '/ops/points-ledger', query: {} }
  const watches = [], navigations = []
  const context = {
    ref: value => ({ value }), shallowRef: value => ({ value }), reactive: value => value, computed: fn => ({ get value() { return fn() } }),
    onBeforeUnmount() {}, watch: (_, callback) => { watches.push(callback) },
    useRoute: () => route, useRouter: () => ({ resolve: value => ({ fullPath: JSON.stringify(value) }), replace(location) { navigations.push(location) } }),
    ...query, parseOperationsQuery: (value, mode) => query.parseOperationsQuery(value, mode, now),
  }
  const factory = new Function(...Object.keys(context), `${composableCode}; return usePointsOperations;`)(...Object.values(context))
  return { state: factory('ledger', fetch), route, navigations, sync: () => watches[0]() }
}
const flush = () => new Promise(resolve => setImmediate(resolve))
test('旧响应不覆盖新的查询结果，失败不显示成零条成功记录', async () => {
  let finishFirst, calls = 0
  const { state, route, sync } = setup(async () => {
    calls++
    if (calls === 1) return new Promise(resolve => { finishFirst = resolve })
    if (calls === 3) throw new Error('network')
    return { code: 0, data: { items: [{ id: 'REWARD:2' }], total: 1 } }
  })
  sync(); route.query = { userId: '2' }; sync(); await flush()
  finishFirst({ code: 0, data: { items: [{ id: 'AI:1' }], total: 20 } }); await flush()
  assert.equal(state.result.value.items[0].id, 'REWARD:2')
  state.retry(); await flush()
  assert.equal(state.result.value, undefined); assert.match(state.error.value, /读取失败/)
})
test('坏URL参数不会触发API，也不能保留之前的成功总数', async () => {
  let calls = 0
  const { state, route, sync } = setup(async () => { calls++; return { code: 0, data: { items: [], total: 0 } } })
  route.query = { from: 'not-a-day' }; sync(); await flush()
  assert.equal(calls, 0); assert.equal(state.result.value, undefined); assert.match(state.validation.value, /日期范围/)
})

test('加载中的分页钳位事件不改变查询，成功后允许翻页', async () => {
  let finish
  const { state, route, navigations, sync } = setup(() => new Promise(resolve => { finish = resolve }))
  route.query = { page: '2' }; sync()
  state.changePage(1); state.changePageSize(50)
  assert.equal(navigations.length, 0)
  finish({ code: 0, data: { items: [], total: 60 } }); await flush()
  state.changePage(2)
  assert.equal(navigations.length, 0)
  state.changePage(3)
  assert.equal(navigations[0].query.page, '3')
})
