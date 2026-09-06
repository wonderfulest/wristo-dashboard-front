import test from 'node:test'
import assert from 'node:assert/strict'
import { activationDetailRoute, activationLocation, activationTime, activationSourceLabel, activationAssetUrl } from '../src/components/dashboard/activationDetail.mjs'

test('email route preserves plus addressing and normalizes case without manual URL concatenation', () => {
  assert.deepEqual(activationDetailRoute(' User+tag@Example.com '), { path: '/dashboard/activations/user', query: { email: 'user+tag@example.com' } })
})
test('historical time and missing location remain unknown even if purchase country exists', () => {
  assert.equal(activationTime(null), '未知（历史未记录）')
  assert.equal(activationTime('2026-09-06T10:20:30.123'), '2026-09-06 10:20:30 UTC')
  assert.equal(activationLocation({ purchaseCountryCode: 'US' }).place, '未知（未采集）')
})
test('location identifies checkout versus activation and suppresses unsupported origins', () => {
  const item = { countryName: 'Germany', region: 'Berlin', city: 'Berlin', locationSource: 'ACTIVATION_REQUEST' }
  assert.deepEqual(activationLocation(item), { place: 'Germany · Berlin', label: '激活请求 IP 推测位置' })
  assert.equal(activationLocation({ ...item, locationSource: 'CHECKOUT_REQUEST' }).label, '下单请求 IP 推测位置')
  assert.equal(activationLocation({ ...item, locationSource: 'WEBHOOK' }).place, '未知（未采集）')
  assert.equal(activationSourceLabel('EXISTING_BUNDLE'), '已有套餐权益')
})

test('app assets allow web URLs and reject missing or executable links', () => {
  assert.equal(activationAssetUrl('https://example.com/app.png'), 'https://example.com/app.png')
  for (const value of [null, '', 'javascript:alert(1)', 'data:text/html,test', '/unknown']) {
    assert.equal(activationAssetUrl(value), '')
  }
})
