import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  createEmptyUnitForm,
  deleteVariant,
  renameVariant,
  replaceUnitForm,
} from '../src/views/dashboard/data-options/unitCatalogEditor.mjs'

test('unit editor starts with a valid explicit non-none variant shape', () => {
  assert.deepEqual(createEmptyUnitForm(), {
    id: undefined,
    unitKey: '',
    name: '',
    defaultVariant: 'default',
    variants: {
      default: { aliases: ['default'], label: { eng: '', zhs: '' } },
    },
    isActive: 1,
    sortOrder: 0,
    description: '',
  })
})

test('renaming a variant only follows the default when the old key was default', () => {
  const defaultVariant = {
    unitKey: 'distance',
    defaultVariant: 'km',
    variants: {
      km: { aliases: ['km'], label: { eng: 'km', zhs: '公里' } },
      mi: { aliases: ['mi'], label: { eng: 'mi', zhs: '英里' } },
    },
  }
  assert.equal(renameVariant(defaultVariant, 'km', 'kilometre'), null)
  assert.equal(defaultVariant.defaultVariant, 'kilometre')
  assert.equal(Object.hasOwn(defaultVariant.variants, 'km'), false)

  assert.equal(renameVariant(defaultVariant, 'mi', 'mile'), null)
  assert.equal(defaultVariant.defaultVariant, 'kilometre')
})

test('variant keys use the strict trimmed catalog regex', () => {
  const form = {
    unitKey: 'distance',
    defaultVariant: 'km',
    variants: { km: { aliases: ['km'], label: { eng: 'km', zhs: '公里' } } },
  }
  assert.equal(renameVariant(form, 'km', ' KM '), 'variantKey must match ^[a-z][a-z0-9_]*$')
  assert.equal(renameVariant(form, 'km', ' kilometre '), null)
  assert.equal(form.defaultVariant, 'kilometre')
})

test('current default cannot be deleted before another default is selected', () => {
  const form = {
    unitKey: 'distance',
    defaultVariant: 'km',
    variants: {
      km: { aliases: ['km'], label: { eng: 'km', zhs: '公里' } },
      mi: { aliases: ['mi'], label: { eng: 'mi', zhs: '英里' } },
    },
  }
  assert.equal(deleteVariant(form, 'km'), 'Select another default variant before deleting km')
  assert.equal(Object.hasOwn(form.variants, 'km'), true)
  form.defaultVariant = 'mi'
  assert.equal(deleteVariant(form, 'km'), null)
  assert.equal(Object.hasOwn(form.variants, 'km'), false)
})

test('replacing an edit form removes stale server-only state before add', () => {
  const target = { ...createEmptyUnitForm(), id: 7, referenceCount: 3, unitKey: 'distance' }
  replaceUnitForm(target, createEmptyUnitForm())
  assert.equal(Object.hasOwn(target, 'referenceCount'), false)
  assert.equal(target.id, undefined)
  assert.equal(target.unitKey, '')
})

test('units tab provides paging, CRUD, reference safety, and fail-closed writes', async () => {
  const [page, panel, dialog, variants] = await Promise.all([
    readFile(new URL('../src/views/dashboard/data-options/DataTypeOptionsPage.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/views/dashboard/data-options/DataUnitDefinitionsPanel.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/views/dashboard/data-options/DataUnitDefinitionDialog.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/views/dashboard/data-options/DataUnitVariantsEditor.vue', import.meta.url), 'utf8'),
  ])

  assert.match(page, /el-tabs/)
  assert.match(page, /Data Items/)
  assert.match(page, /Units/)
  assert.match(page, /DataUnitDefinitionsPanel/)
  assert.match(panel, /pageDataUnits/)
  assert.match(panel, /referenceCount/)
  assert.match(panel, /activeLoadingIds/)
  assert.match(panel, /row\.referenceCount > 0/)
  assert.match(panel, /removeDataUnit/)
  assert.match(panel, /updateDataUnit/)
  assert.match(panel, /createLatestRequestGate/)
  assert.match(panel, /catch/)
  assert.match(panel, /loadData\(\)/)
  assert.doesNotMatch(panel, /splice\(/)
  assert.match(dialog, /:loading="saving"/)
  assert.match(dialog, /validateUnitForm/)
  assert.match(dialog, /normalizeUnitPayload/)
  assert.match(dialog, /clearValidate/)
  assert.match(dialog, /formVersion/)
  assert.match(variants, /renameVariant/)
  assert.match(variants, /deleteVariant/)
  assert.match(variants, /allow-create/)
  assert.match(variants, /label\.eng/)
  assert.match(variants, /label\.zhs/)
})

test('none unit is represented without variants or a default', async () => {
  const dialog = await readFile(
    new URL('../src/views/dashboard/data-options/DataUnitDefinitionDialog.vue', import.meta.url),
    'utf8',
  )
  assert.match(dialog, /form\.unitKey/)
  assert.match(dialog, /form\.variants = {}/)
  assert.match(dialog, /form\.defaultVariant = null/)
})
