import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  dialSummary,
  normalizeDialFields,
  validateDialFields,
} from '../src/views/dashboard/data-options/dialConfig.mjs'

test('not supported clears all dial metadata', () => {
  assert.deepEqual(
    normalizeDialFields({ dialMode: null, dialMin: 0, dialMax: 100, dialGoalSource: 'garmin' }),
    { dialMode: null, dialMin: null, dialMax: null, dialGoalSource: null },
  )
})

test('goal keeps source and clears range bounds', () => {
  assert.deepEqual(
    normalizeDialFields({ dialMode: 'goal', dialMin: 0, dialMax: 100, dialGoalSource: 'garmin' }),
    { dialMode: 'goal', dialMin: null, dialMax: null, dialGoalSource: 'garmin' },
  )
})

test('range keeps zero minimum and clears goal source', () => {
  assert.deepEqual(
    normalizeDialFields({ dialMode: 'range', dialMin: 0, dialMax: 100, dialGoalSource: 'garmin' }),
    { dialMode: 'range', dialMin: 0, dialMax: 100, dialGoalSource: null },
  )
})

test('range requires finite ordered bounds', () => {
  assert.equal(
    validateDialFields({ dialMode: 'range', dialMin: 100, dialMax: 0 }),
    'Range maximum must be greater than minimum',
  )
  assert.equal(
    validateDialFields({ dialMode: 'range', dialMin: Number.NaN, dialMax: 100 }),
    'Range minimum and maximum are required',
  )
})

test('goal requires a source', () => {
  assert.equal(validateDialFields({ dialMode: 'goal', dialGoalSource: null }), 'Goal source is required')
})

test('summary describes each dial mode', () => {
  assert.equal(dialSummary({ dialMode: 'goal', dialGoalSource: 'garmin' }), 'Goal · Garmin')
  assert.equal(dialSummary({ dialMode: 'range', dialMin: 0, dialMax: 100 }), 'Range · 0–100')
  assert.equal(dialSummary({ dialMode: null }), '—')
})

test('dashboard dialog exposes dial mode and conditional fields', async () => {
  const source = await readFile(
    new URL('../src/views/dashboard/data-options/DataTypeOptionDialog.vue', import.meta.url),
    'utf8',
  )
  assert.match(source, /v-model="form\.dialMode"/)
  assert.match(source, /form\.dialMode === 'goal'/)
  assert.match(source, /form\.dialMode === 'range'/)
  assert.match(source, /normalizeDialFields/)
  assert.match(source, /validateDialFields/)
})

test('dashboard list renders the shared dial summary', async () => {
  const source = await readFile(
    new URL('../src/views/dashboard/data-options/DataTypeOptionsList.vue', import.meta.url),
    'utf8',
  )
  assert.match(source, /label="Dial"/)
  assert.match(source, /dialSummary\(row\)/)
})
