import test from 'node:test'
import assert from 'node:assert/strict'

import {
  createEmptyDataTypeForm,
  normalizeDataTypePayload,
  normalizeUnitPayload,
  validateDataTypeForm,
  validateLocalizedText,
  validateUnitForm,
} from '../src/views/dashboard/data-options/dataCatalogForm.mjs'

test('data item form owns two separate required label purposes', () => {
  const form = createEmptyDataTypeForm()

  assert.deepEqual(form.settingsLabel, { eng: '', zhs: '' })
  assert.deepEqual(form.label, { eng: '', zhs: '' })
  assert.equal(form.unitKey, 'none')
})

test('data item payload trims canonical labels and omits compatibility aliases', () => {
  const payload = normalizeDataTypePayload({
    ...createEmptyDataTypeForm(),
    metricSymbol: ' :FIELD_TYPE_STEPS ',
    category: 'field',
    valueCode: 1,
    settingsLabel: { eng: ' Steps ', zhs: ' 步数 ' },
    label: { eng: ' STEPS ', zhs: ' 步数 ' },
    unitKey: ' none ',
    enLabel: 'legacy',
    labelCn: '旧值',
    displayLabel: 'legacy',
    labelI18n: { eng: 'legacy' },
    unit: 'legacy',
    value: 99,
  })

  assert.deepEqual(payload.settingsLabel, { eng: 'Steps', zhs: '步数' })
  assert.deepEqual(payload.label, { eng: 'STEPS', zhs: '步数' })
  assert.equal(payload.metricSymbol, ':FIELD_TYPE_STEPS')
  assert.equal(payload.unitKey, 'none')
  for (const key of ['enLabel', 'labelCn', 'displayLabel', 'labelI18n', 'unit', 'value']) {
    assert.equal(Object.hasOwn(payload, key), false)
  }
})

test('localized text reports the exact missing-language field path', () => {
  assert.equal(validateLocalizedText({ eng: 'km', zhs: '' }, 'label'), 'label.zhs is required')
  assert.equal(validateLocalizedText({ eng: '', zhs: '公里' }, 'settingsLabel'), 'settingsLabel.eng is required')
})

test('data item validation requires both label purposes and strict symbol and unit keys', () => {
  const base = {
    ...createEmptyDataTypeForm(),
    metricSymbol: ':FIELD_TYPE_STEPS',
    category: 'field',
    valueCode: 1,
    settingsLabel: { eng: 'Steps', zhs: '步数' },
    label: { eng: 'STEPS', zhs: '步数' },
  }

  assert.equal(validateDataTypeForm({ ...base, label: { eng: '', zhs: '步数' } }), 'label.eng is required')
  assert.equal(
    validateDataTypeForm({ ...base, metricSymbol: ':field' }),
    'metricSymbol must match ^:[A-Z][A-Z0-9_]*$',
  )
  assert.equal(
    validateDataTypeForm({ ...base, unitKey: 'NONE' }),
    'unitKey must match ^[a-z][a-z0-9_]*$',
  )
})

test('unit payload trims strict lowercase keys and normalizes aliases deterministically', () => {
  const payload = normalizeUnitPayload({
    unitKey: ' distance ',
    name: ' Distance ',
    defaultVariant: ' km ',
    variants: {
      ' km ': {
        aliases: [' KM ', 'km', ' Kilometre '],
        label: { eng: ' km ', zhs: ' 公里 ' },
      },
    },
    isActive: 1,
    sortOrder: 10,
    description: ' Length unit ',
  })

  assert.equal(payload.unitKey, 'distance')
  assert.equal(payload.defaultVariant, 'km')
  assert.deepEqual(payload.variants, {
    km: {
      aliases: ['kilometre', 'km'],
      label: { eng: 'km', zhs: '公里' },
    },
  })
})

test('unit validation rejects uppercase unit, variant, and default keys at exact paths', () => {
  const base = {
    name: 'Distance',
    defaultVariant: 'km',
    variants: { km: { aliases: ['km'], label: { eng: 'km', zhs: '公里' } } },
    isActive: 1,
    sortOrder: 0,
  }

  assert.equal(
    validateUnitForm({ ...base, unitKey: 'Distance' }),
    'unitKey must match ^[a-z][a-z0-9_]*$',
  )
  assert.equal(
    validateUnitForm({
      ...base,
      unitKey: 'distance',
      variants: { KM: { aliases: ['km'], label: { eng: 'km', zhs: '公里' } } },
    }),
    'distance.variantKey must match ^[a-z][a-z0-9_]*$',
  )
  assert.equal(
    validateUnitForm({ ...base, unitKey: 'distance', defaultVariant: 'KM' }),
    'distance.defaultVariant must match ^[a-z][a-z0-9_]*$',
  )
})

test('unit validation mirrors none and active default-variant rules with exact paths', () => {
  assert.equal(
    validateUnitForm({
      unitKey: 'none',
      name: 'None',
      defaultVariant: 'none',
      variants: {},
      isActive: 1,
      sortOrder: 0,
    }),
    'none.defaultVariant must be null',
  )

  assert.equal(
    validateUnitForm({
      unitKey: 'distance',
      name: 'Distance',
      defaultVariant: 'mi',
      variants: { km: { aliases: ['km'], label: { eng: 'km', zhs: '公里' } } },
      isActive: 1,
      sortOrder: 0,
    }),
    'distance.defaultVariant must reference an existing variant',
  )
})

test('unit validation requires localized labels and nonblank aliases at exact variant paths', () => {
  const base = {
    unitKey: 'distance',
    name: 'Distance',
    defaultVariant: 'km',
    isActive: 1,
    sortOrder: 0,
  }

  assert.equal(
    validateUnitForm({
      ...base,
      variants: { km: { aliases: ['km'], label: { eng: 'km', zhs: '' } } },
    }),
    'distance.variants.km.label.zhs is required',
  )
  assert.equal(
    validateUnitForm({
      ...base,
      variants: { km: { aliases: ['  '], label: { eng: 'km', zhs: '公里' } } },
    }),
    'distance.variants.km.aliases must not contain blank values',
  )
})

test('unit validation rejects aliases owned by two variants', () => {
  const error = validateUnitForm([
    {
      unitKey: 'distance',
      name: 'Distance',
      defaultVariant: 'm',
      variants: { m: { aliases: ['m'], label: { eng: 'm', zhs: '米' } } },
      isActive: 1,
      sortOrder: 0,
    },
    {
      unitKey: 'length',
      name: 'Length',
      defaultVariant: 'meter',
      variants: { meter: { aliases: [' M '], label: { eng: 'm', zhs: '米' } } },
      isActive: 1,
      sortOrder: 1,
    },
  ])

  assert.equal(error, 'alias "m" is used by distance.m and length.meter')
})
