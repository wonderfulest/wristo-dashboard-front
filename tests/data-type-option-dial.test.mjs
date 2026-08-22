import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  allowedDialMode,
  dialModeOptions,
  dialSummary,
  normalizeDialFields,
  validateDialFields,
} from '../src/views/dashboard/data-options/dialConfig.mjs'

test('whitelist assigns one explicit dial mode to approved data only', () => {
  assert.equal(allowedDialMode(':GOAL_TYPE_WEEKLY_ACTIVE_MINUTES'), 'goal')
  assert.equal(allowedDialMode(':GOAL_TYPE_CALORIES'), null)
  assert.equal(allowedDialMode(':FIELD_TYPE_WEATHER_HUMIDITY'), 'range')
  assert.equal(allowedDialMode(':FIELD_TYPE_TEMPERATURE'), 'range')
  assert.equal(allowedDialMode(':FIELD_TYPE_SENSOR_PRESSURE'), 'range')
  assert.equal(allowedDialMode(':FIELD_TYPE_WEATHER_WIND_DIRECTION'), 'direction')
})

test('editor only offers the approved mode plus not supported', () => {
  assert.deepEqual(dialModeOptions(':GOAL_TYPE_STEPS'), [null, 'goal'])
  assert.deepEqual(dialModeOptions(':FIELD_TYPE_WEATHER_HUMIDITY'), [null, 'range'])
  assert.deepEqual(dialModeOptions(':FIELD_TYPE_TEMPERATURE'), [null, 'range'])
  assert.deepEqual(dialModeOptions(':FIELD_TYPE_WEATHER_WIND_DIRECTION'), [null, 'direction'])
})

test('not supported clears all dial metadata', () => {
  assert.deepEqual(
    normalizeDialFields({ dialMode: null, dialMin: 0, dialMax: 100, dialGoalSource: 'garmin' }),
    { dialMode: null, dialMin: null, dialMax: null, dialGoalSource: null, dialDirectionUnit: null },
  )
})

test('goal keeps source and clears range bounds', () => {
  assert.deepEqual(
    normalizeDialFields({ dialMode: 'goal', dialMin: 0, dialMax: 100, dialGoalSource: 'garmin' }),
    { dialMode: 'goal', dialMin: null, dialMax: null, dialGoalSource: 'garmin', dialDirectionUnit: null },
  )
})

test('range keeps zero minimum and clears goal source', () => {
  assert.deepEqual(
    normalizeDialFields({ dialMode: 'range', dialMin: 0, dialMax: 100, dialGoalSource: 'garmin' }),
    { dialMode: 'range', dialMin: 0, dialMax: 100, dialGoalSource: null, dialDirectionUnit: null },
  )
})

test('direction keeps degree unit and clears goal and range metadata', () => {
  assert.deepEqual(
    normalizeDialFields({
      dialMode: 'direction', dialMin: 0, dialMax: 360,
      dialGoalSource: 'garmin', dialDirectionUnit: 'degree',
    }),
    {
      dialMode: 'direction', dialMin: null, dialMax: null,
      dialGoalSource: null, dialDirectionUnit: 'degree',
    },
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

test('validation rejects fixed goals and mode mismatches', () => {
  assert.equal(
    validateDialFields({ metricSymbol: ':GOAL_TYPE_STEPS', dialMode: 'goal', dialGoalSource: 'fixed' }),
    'Goal Dial requires Garmin goal source',
  )
  assert.equal(
    validateDialFields({ metricSymbol: ':FIELD_TYPE_WEATHER_HUMIDITY', dialMode: 'goal', dialGoalSource: 'garmin' }),
    'Data type is approved for Range Dial only',
  )
  assert.equal(
    validateDialFields({ metricSymbol: ':FIELD_TYPE_FEELS_LIKE_TEMPERATURE', dialMode: 'range', dialMin: -20, dialMax: 50 }),
    'Data type is not approved for Dial',
  )
  assert.equal(
    validateDialFields({ metricSymbol: ':FIELD_TYPE_WEATHER_WIND_DIRECTION', dialMode: 'range', dialMin: 0, dialMax: 360 }),
    'Data type is approved for Direction Dial only',
  )
})

test('direction requires degree unit', () => {
  assert.equal(
    validateDialFields({
      metricSymbol: ':FIELD_TYPE_WEATHER_WIND_DIRECTION', dialMode: 'direction', dialDirectionUnit: null,
    }),
    'Direction Dial requires degree unit',
  )
})

test('summary describes each dial mode', () => {
  assert.equal(dialSummary({ dialMode: 'goal', dialGoalSource: 'garmin' }), 'Goal · Garmin')
  assert.equal(dialSummary({ dialMode: 'range', dialMin: 0, dialMax: 100 }), 'Range · 0–100')
  assert.equal(dialSummary({ dialMode: 'direction', dialDirectionUnit: 'degree' }), 'Direction · Degree')
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
  assert.match(source, /form\.dialMode === 'direction'/)
  assert.match(source, /form\.dialDirectionUnit/)
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
