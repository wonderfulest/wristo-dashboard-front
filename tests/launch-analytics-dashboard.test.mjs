import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('dashboard mounts launch analytics after business overview and before operations inbox', async () => {
  const source = await read('src/views/dashboard/Dashboard.vue')
  const overview = source.indexOf('<BusinessOverview')
  const analytics = source.indexOf('<LaunchOperationsRecommendation')
  const inbox = source.indexOf('<OperationsInbox')
  assert.ok(overview < analytics && analytics < inbox)
  for (const component of [
    'LaunchCohortContribution', 'LaunchLifecycleChart', 'LaunchMarginalRevenue',
    'CategoryValueMatrix', 'DesignerValueMatrix',
  ]) assert.match(source, new RegExp(`<${component}`))
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
  assert.match(recommendation, /首发 \{\{ quota\.firstLaunchQuota \}\} \/ 重新上线/)
  for (const label of ['首发', '重新上线', '存量', '直接单品营收', '带动 Bundle 营收']) {
    assert.match(contribution, new RegExp(label))
  }
})
