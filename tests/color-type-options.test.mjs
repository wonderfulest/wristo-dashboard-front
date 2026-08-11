import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../src/views/dashboard/system/ColorTypeOptions.vue', import.meta.url),
  'utf8',
)

test('颜色配置页展示中文名和独立的系统默认颜色分组', () => {
  assert.match(source, /系统默认颜色/)
  assert.match(source, /Garmin 颜色选项/)
  assert.match(source, /label="中文名"/)
  assert.match(source, /const systemDefaultColorHexes = \[/)
  assert.match(source, /nameCn: '白色'/)
  assert.match(source, /nameCn: '墨绿色'/)
})

test('系统默认颜色覆盖 Studio 当前的八个默认值', () => {
  for (const hex of [
    '#FFFFFF',
    '#000000',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FFAA00',
    '#5500AA',
  ]) {
    assert.match(source, new RegExp(`'${hex}'`))
  }
})
