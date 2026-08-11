import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const readSource = (path) => readFile(new URL(path, root), 'utf8')

test('trial admin exposes a configurable activation email ranking', async () => {
  const [view, api] = await Promise.all([
    readSource('src/views/orders/OrdersTrials.vue'),
    readSource('src/api/trial.ts'),
  ])

  assert.match(view, /激活账号排行/)
  assert.match(view, /\[10, 20, 50, 100\]/)
  assert.match(view, /getTrialActivationEmailRanking/)
  assert.match(api, /\/admin\/trials\/activation-email-ranking/)
  assert.match(api, /activatedAppCount:\s*number/)
})
