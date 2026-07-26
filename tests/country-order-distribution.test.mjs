import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDefaultCountryOrderRange,
  clampCountryOrderRange,
  formatCountryLabel,
} from '../src/components/dashboard/countryOrderDistributionUtils.mjs'

test('default country order range covers one calendar month ending today', () => {
  assert.deepEqual(buildDefaultCountryOrderRange(new Date(2026, 6, 26, 12, 0, 0)), [
    '2026-06-26',
    '2026-07-26',
  ])
})

test('country order range clamps its start to one calendar month before the end', () => {
  assert.deepEqual(clampCountryOrderRange(['2026-05-01', '2026-07-26']), {
    range: ['2026-06-26', '2026-07-26'],
    clamped: true,
  })
})

test('country order range preserves a valid one-month range', () => {
  assert.deepEqual(clampCountryOrderRange(['2026-06-26', '2026-07-26']), {
    range: ['2026-06-26', '2026-07-26'],
    clamped: false,
  })
})

test('country label contains localized name and two-letter code', () => {
  const displayNames = { of: (code) => code === 'US' ? '美国' : undefined }

  assert.equal(formatCountryLabel('US', displayNames), '美国（US）')
})

test('country label falls back safely for unknown and invalid codes', () => {
  const throwingDisplayNames = { of: () => { throw new RangeError('invalid region') } }

  assert.equal(formatCountryLabel('Unknown', throwingDisplayNames), '未知')
  assert.equal(formatCountryLabel('ZZ', throwingDisplayNames), 'ZZ')
})
