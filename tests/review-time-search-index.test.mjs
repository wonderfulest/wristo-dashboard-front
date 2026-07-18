import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('refreshing the review time also triggers a full search-index rebuild without awaiting it', async () => {
  const source = await readFile(
    new URL('../src/components/dashboard/ReviewTimeControl.vue', import.meta.url),
    'utf8',
  )

  assert.match(source, /import \{ rebuildAll \} from '@\/api\/watchface-search'/)
  assert.match(source, /await refreshReviewTime\(\)[\s\S]*void rebuildAll\(true\)\.catch\(\(\) => undefined\)/)
})
