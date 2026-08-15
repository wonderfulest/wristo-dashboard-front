import test from 'node:test'
import assert from 'node:assert/strict'

import { formatProductGoLive } from '../src/views/products/productDisplay.mjs'

test('formatProductGoLive formats an available上线日期', () => {
  const value = formatProductGoLive('2026-08-13T09:30:00', () => '2026-08-13')

  assert.equal(value, '2026-08-13')
})

test('formatProductGoLive displays a dash when上线日期 is unavailable', () => {
  assert.equal(formatProductGoLive(undefined, () => 'unexpected'), '-')
  assert.equal(formatProductGoLive('', () => 'unexpected'), '-')
})
