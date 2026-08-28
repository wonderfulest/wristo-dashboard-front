import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('launch strategy page owns all launch analytics sections', async () => {
  const source = await read('src/views/dashboard/LaunchStrategy.vue')
  assert.match(source, /<LaunchOperationsRecommendation/)
  assert.match(source, /@trained="refreshAnalytics"/)
  assert.match(source, /:key="analyticsRevision"/)
  for (const component of [
    'LaunchCohortContribution', 'LaunchLifecycleChart', 'LaunchMarginalRevenue',
  ]) assert.match(source, new RegExp(`<${component}`))
  assert.doesNotMatch(source, /CategoryValueMatrix|DesignerValueMatrix/)
})

test('recommendation and cohort sections expose operational evidence and revenue attribution', async () => {
  const [recommendation, contribution] = await Promise.all([
    read('src/components/dashboard/LaunchOperationsRecommendation.vue'),
    read('src/components/dashboard/LaunchCohortContribution.vue'),
  ])
  assert.match(recommendation, /建议上线量/)
  assert.match(recommendation, /边际营收/)
  assert.match(recommendation, /存量保护/)
  assert.match(recommendation, /模型版本/)
  assert.match(recommendation, /各品类建议上线量/)
  assert.match(recommendation, /trainLaunchAnalytics/)
  assert.match(recommendation, /getLaunchAnalyticsTrainingStatus/)
  assert.match(recommendation, /训练中/)
  assert.match(recommendation, /低置信度兜底建议/)
  assert.match(recommendation, /emit\('trained'\)/)
  assert.doesNotMatch(recommendation, /@click="load">刷新模型/)
  assert.match(recommendation, /首发 \{\{ quota\.firstLaunchQuota \}\} \/ 重新上线/)
  for (const label of ['首发', '重新上线', '存量', '直接单品营收', '带动 Bundle 营收']) {
    assert.match(contribution, new RegExp(label))
  }
})
