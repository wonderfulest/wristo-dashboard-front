import test from 'node:test'
import assert from 'node:assert/strict'

import { formatProcessingDuration } from '../src/utils/duration.ts'

test('formats packaging processing duration for the records table', () => {
  assert.equal(formatProcessingDuration(null, null), '-')
  assert.equal(formatProcessingDuration(null, 1_000), '处理中')
  assert.equal(formatProcessingDuration(45_000, 1_000), '45秒')
  assert.equal(formatProcessingDuration(123_456, 1_000), '2分 3秒')
  assert.equal(formatProcessingDuration(3_661_000, 1_000), '1小时 1分 1秒')
})
