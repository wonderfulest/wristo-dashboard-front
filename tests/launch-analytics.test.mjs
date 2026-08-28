import test from 'node:test'
import assert from 'node:assert/strict'

import {
  attributedRevenueCents,
  contributionsAreConserved,
  formatUsdCents,
  modelStatusLabel,
  quadrantLabel,
  recommendationRangeLabel,
} from '../src/components/dashboard/launchAnalyticsUtils.mjs'

test('cohort attributed revenue conserves direct bundle and refund amounts', () => {
  const cohort = { directRevenueCents: 1000, bundleRevenueCents: 500, refundCents: 200, attributedRevenueCents: 1300 }
  assert.equal(attributedRevenueCents(cohort), 1300)
  assert.equal(contributionsAreConserved({ FIRST_LAUNCH: cohort }), true)
  assert.equal(contributionsAreConserved({ STOCK: { ...cohort, attributedRevenueCents: 1400 } }), false)
})

test('formats cents and recommendation ranges without inventing values', () => {
  assert.equal(formatUsdCents(12345), '$123.45')
  assert.equal(formatUsdCents(null), '—')
  assert.equal(recommendationRangeLabel({ recommendedMinLaunches: 10, recommendedMaxLaunches: 15 }), '10–15 款/天')
  assert.equal(recommendationRangeLabel({ recommendedMinLaunches: null, recommendedMaxLaunches: null }), '证据不足')
})

test('maps partial insufficient and value quadrants to explicit Chinese labels', () => {
  assert.equal(modelStatusLabel({ partial: true, status: 'READY' }), '实时数据，不参与训练')
  assert.equal(modelStatusLabel({ partial: false, status: 'EVIDENCE_INSUFFICIENT' }), '样本不足')
  assert.equal(quadrantLabel('STAR'), '高规模 / 高效率')
  assert.equal(quadrantLabel('LOW_VALUE'), '低规模 / 低效率')
})
