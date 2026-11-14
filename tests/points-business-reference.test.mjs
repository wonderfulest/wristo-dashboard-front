import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const source = fs.readFileSync(new URL('../src/utils/pointsBusinessReference.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const { businessReferenceLedgerLink } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const detail = (kind, eventKey, createdAt) => ({ kind, id: 'record', userId: '9007199254740993', fields: [
  { key: kind === 'AI_CALL' ? 'creditEventKey' : 'eventKey', value: eventKey }, { key: 'createdAt', value: createdAt },
] })

test('AI反查涵盖北京时间跨午夜扣点，保持用户及事件编号精确匹配', () => {
  assert.deepEqual(businessReferenceLedgerLink(detail('AI_CALL', 'ai:request-1', '2026-11-13T16:00:01Z')), {
    path: '/ops/points-ledger', query: { userId: '9007199254740993', asset: 'AI', eventKey: 'ai:request-1', from: '2026-11-13', to: '2026-11-14' },
  })
})
test('兑换同一事务按北京时间兑换日反查，不沿用默认30天', () => {
  assert.deepEqual(businessReferenceLedgerLink(detail('REDEMPTION', 'redeem:WRP1', '2025-01-01T18:00:00Z')), {
    path: '/ops/points-ledger', query: { userId: '9007199254740993', asset: 'REWARD', eventKey: 'redeem:WRP1', from: '2025-01-02', to: '2025-01-02' },
  })
})
test('未实际扣点、缺少时间或不支持的关联不制造流水链接', () => {
  for (const value of [undefined, detail('AI_CALL', null, '2026-11-14T00:00:00Z'), detail('REDEMPTION', 'redeem:1', 'invalid'), detail('CREDIT_PURCHASE', 'purchase:1', '2026-11-14T00:00:00Z')]) {
    assert.equal(businessReferenceLedgerLink(value), undefined)
  }
})
