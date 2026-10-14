import test from 'node:test'
import assert from 'node:assert/strict'
import { analyticsCount, analyticsRate } from '../src/views/marketing/components/campaignAnalyticsMetrics.mjs'

test('unavailable tracking and absent coverage are distinct from observed zero counts', () => {
  assert.equal(analyticsCount(0, false, 10), '未启用')
  assert.equal(analyticsCount(0, true, 0), '暂无数据')
  assert.equal(analyticsCount(0, true, 10), 0)
  assert.equal(analyticsCount(4, false, 10), 4)
})

test('rates preserve missing denominators and historical events without clamping incomplete open data', () => {
  assert.equal(analyticsRate(0, 0), '暂无数据')
  assert.equal(analyticsRate(0, 10), '0.0%')
  assert.equal(analyticsRate(0, 10, false), '未启用')
  assert.equal(analyticsRate(3, 10, false), '30.0%')
  assert.equal(analyticsRate(4, 3), '133.3%')
})

 test('configured SES without observed callbacks never implies zero delivery', () => {
  assert.equal(analyticsCount(0, true, 10, false), '等待回传')
  assert.equal(analyticsCount(0, true, 0, false), '暂无数据')
  assert.equal(analyticsCount(2, true, 10, false), 2)
  assert.equal(analyticsRate(0, 10, true, false), '等待回传')
  assert.equal(analyticsRate(0, 0, true, false), '暂无数据')
})
