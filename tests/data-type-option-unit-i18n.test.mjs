import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = relativePath => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8')

test('data type option contracts expose unit i18n', async () => {
  const source = await read('src/types/data-type-option.ts')

  assert.match(source, /interface DataTypeOptionVO[\s\S]*unitI18n\?: LabelI18n/)
  assert.match(source, /interface DataTypeOptionCreateDTO[\s\S]*unitI18n\?: LabelI18n/)
})

test('i18n popover edits the configured data type option field', async () => {
  const source = await read('src/views/dashboard/data-options/DataOptionI18nPopover.vue')

  assert.match(source, /field:\s*'labelI18n'\s*\|\s*'unitI18n'/)
  assert.match(source, /props\.row\[props\.field\]/)
  assert.match(source, /\[props\.field\]:\s*\{\s*\.\.\.editI18n\s*\}/)
})

test('i18n language selector filters supported languages by typed input', async () => {
  const source = await read('src/views/dashboard/data-options/DataOptionI18nPopover.vue')
  const languageSelect = source.match(/<el-select[\s\S]*?<\/el-select>/)?.[0] || ''

  assert.match(languageSelect, /\bfilterable\b/)
  assert.doesNotMatch(languageSelect, /\ballow-create\b/)
})

test('data type option list renders separate label and unit i18n editors', async () => {
  const source = await read('src/views/dashboard/data-options/DataTypeOptionsList.vue')

  assert.match(source, /label="i18n"[\s\S]*field="labelI18n"/)
  assert.match(source, /label="Unit i18n"[\s\S]*field="unitI18n"/)
})

test('data type option dialog sends English and Chinese unit translations', async () => {
  const source = await read('src/views/dashboard/data-options/DataTypeOptionDialog.vue')

  assert.match(source, /label="EN Unit"[\s\S]*form\.engUnit/)
  assert.match(source, /label="CN Unit"[\s\S]*form\.zhsUnit/)
  assert.match(source, /unitI18n:\s*\{\s*eng:\s*props\.form\.engUnit\s*\|\|\s*''\s*,\s*zhs:\s*props\.form\.zhsUnit\s*\|\|\s*''\s*\}/)
})

test('data type option page resets and loads unit translation shortcuts', async () => {
  const source = await read('src/views/dashboard/data-options/DataTypeOptionsPage.vue')

  assert.match(source, /engUnit:\s*''/)
  assert.match(source, /zhsUnit:\s*''/)
  assert.match(source, /row\.unitI18n/)
  assert.match(source, /form\.engUnit/)
  assert.match(source, /form\.zhsUnit/)
})
