import test from 'node:test'
import assert from 'node:assert/strict'
import * as commissionUtils from '../src/views/orders/giftEntitlementCommission.mjs'

const { calculateGiftCommissionUsd } = commissionUtils

test('gift commission preview converts CNY total with the entered CNY per USD rate', () => {
  assert.equal(calculateGiftCommissionUsd(65, 6.5), 10)
  assert.equal(calculateGiftCommissionUsd(33.93, 6.5), 5.22)
})

test('gift commission preview rejects missing and non-positive values', () => {
  assert.equal(calculateGiftCommissionUsd(null, 6.5), null)
  assert.equal(calculateGiftCommissionUsd(65, 0), null)
  assert.equal(calculateGiftCommissionUsd(-1, 6.5), null)
})

test('gift order payout label distinguishes commissioned and non-commissioned records', () => {
  assert.equal(typeof commissionUtils.formatGiftPayoutStatus, 'function')
  assert.equal(commissionUtils.formatGiftPayoutStatus({ commissionEnabled: false, inPayout: 1 }), 'No commission')
  assert.equal(commissionUtils.formatGiftPayoutStatus({ commissionEnabled: true, inPayout: 1 }), 'Yes')
  assert.equal(commissionUtils.formatGiftPayoutStatus({ commissionEnabled: true, inPayout: 0 }), 'No')
})
