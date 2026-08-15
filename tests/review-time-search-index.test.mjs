import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('refreshing the review time awaits and reports the full search-index rebuild step', async () => {
  const source = await readFile(
    new URL('../src/components/dashboard/ReviewTimeControl.vue', import.meta.url),
    'utf8',
  )

  assert.match(source, /import \{ rebuildAll \} from '@\/api\/watchface-search'/)
  assert.match(source, /runRefreshStep\(1, refreshReviewTime\)[\s\S]*await runRefreshStep\(2, \(\) => rebuildAll\(true\)\)/)
  assert.match(source, /刷新未全部完成，请查看失败步骤后重试/)
  assert.doesNotMatch(source, /void rebuildAll\(true\)\.catch\(\(\) => undefined\)/)
})
