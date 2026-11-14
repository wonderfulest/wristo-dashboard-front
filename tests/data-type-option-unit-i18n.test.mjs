import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { createEmptyDataTypeForm, normalizeDataTypePayload, normalizeUnitPayload } from '../src/views/dashboard/data-options/dataCatalogForm.mjs'

const read = relativePath => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8')

test('data items reference the unit dictionary instead of owning unit translations', async () => {
  const source = await read('src/types/data-type-option.ts')
  assert.match(source, /unitKey: string/)
  assert.doesNotMatch(source, /unitI18n|labelI18n/)
  const payload = normalizeDataTypePayload({ ...createEmptyDataTypeForm(), unitKey: 'distance', unitI18n: { eng: 'old' } })
  assert.equal(payload.unitKey, 'distance')
  assert.equal(Object.hasOwn(payload, 'unitI18n'), false)
})

test('unit dictionary payload preserves English and Chinese variant labels', () => {
  const payload = normalizeUnitPayload({
    unitKey: 'distance', name: 'Distance', defaultVariant: 'km',
    selectionPolicy: { type: 'fixed', variant: 'km' },
    variants: { km: { aliases: ['km'], label: { eng: 'km', zhs: '公里' } } },
    isActive: 1, sortOrder: 0, description: '',
  })
  assert.deepEqual(payload.variants.km.label, { eng: 'km', zhs: '公里' })
})

test('data item unit selector filters dictionary entries and previews bilingual labels', async () => {
  const source = await read('src/views/dashboard/data-options/DataTypeOptionDialog.vue')
  assert.match(source, /<el-select v-model="form.unitKey" filterable>/)
  assert.match(source, /variant.label.eng/)
  assert.match(source, /variant.label.zhs/)
  assert.doesNotMatch(source, /form\.engUnit|form\.zhsUnit|DataOptionI18nPopover/)
})
