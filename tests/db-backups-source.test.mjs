import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const viewSource = await readFile(new URL('../src/views/ops/DbBackups.vue', import.meta.url), 'utf8')
const apiSource = await readFile(new URL('../src/api/ops-db.ts', import.meta.url), 'utf8')

test('数据库备份页区分 S3 可用备份和数据库执行记录', () => {
  assert.match(viewSource, /可用备份/)
  assert.match(viewSource, /执行记录/)
  assert.match(viewSource, /getAvailableDbBackups/)
})

test('可用备份与下载地址通过管理 API 获取', () => {
  assert.match(apiSource, /backup\/files/)
  assert.match(apiSource, /download-url/)
})
