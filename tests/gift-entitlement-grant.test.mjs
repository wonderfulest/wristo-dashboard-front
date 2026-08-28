import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildGiftTargetPayload,
  validateGiftTarget,
} from '../src/views/orders/giftEntitlementGrant.mjs'

test('activation code mode requires exactly six digits', () => {
  assert.equal(validateGiftTarget('APP', 'ACTIVATION_CODE', null, null, '12345'), '请输入六位数字激活码')
  assert.equal(validateGiftTarget('APP', 'ACTIVATION_CODE', null, null, '123456'), null)
})

test('activation code mode sends the code without a manually selected app id', () => {
  assert.deepEqual(
    buildGiftTargetPayload('APP', 'ACTIVATION_CODE', 99, null, '123456'),
    { appId: null, bundleId: null, activationCode: '123456' }
  )
})

test('app selection and bundle modes keep their existing target payloads', () => {
  assert.deepEqual(
    buildGiftTargetPayload('APP', 'APP_ID', 99, null, ''),
    { appId: 99, bundleId: null, activationCode: null }
  )
  assert.deepEqual(
    buildGiftTargetPayload('BUNDLE', 'APP_ID', null, 7, ''),
    { appId: null, bundleId: 7, activationCode: null }
  )
})
