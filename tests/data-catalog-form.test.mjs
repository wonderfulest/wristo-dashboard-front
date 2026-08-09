import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  createEmptyDataTypeForm,
  cloneDataTypeForm,
  normalizeDataTypePayload,
  normalizeUnitPayload,
  validateCatalogAliasOwnership,
  validateDataTypeForm,
  validateLocalizedText,
  validateUnitForm,
} from '../src/views/dashboard/data-options/dataCatalogForm.mjs'

test('data item editor exposes separate canonical labels, unit selection, and resource names', async () => {
  const [dialogSource, listSource, pageSource] = await Promise.all([
    readFile(new URL('../src/views/dashboard/data-options/DataTypeOptionDialog.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/views/dashboard/data-options/DataTypeOptionsList.vue', import.meta.url), 'utf8'),
    readFile(new URL('../src/views/dashboard/data-options/DataTypeOptionsPage.vue', import.meta.url), 'utf8'),
  ])

  assert.match(dialogSource, /Connect IQ Settings Label/)
  assert.match(dialogSource, /Watchface Data Label/)
  assert.match(dialogSource, /form\.settingsLabel\.eng/)
  assert.match(dialogSource, /form\.settingsLabel\.zhs/)
  assert.match(dialogSource, /form\.label\.eng/)
  assert.match(dialogSource, /form\.label\.zhs/)
  assert.match(dialogSource, /form\.unitKey/)
  assert.match(dialogSource, /selectedUnit/)
  assert.match(listSource, /DataTypeSettingsLabel/)
  assert.match(listSource, /DataTypeLabel/)
  assert.match(pageSource, /listDataUnits\(1\)/)
  assert.match(pageSource, /cloneDataTypeForm\(row\)/)
  assert.doesNotMatch(pageSource, /labelCn|enLabel|displayLabel|labelI18n|engShort|zhsShort/)
  assert.doesNotMatch(listSource, /DataOptionI18nPopover|displayLabel|labelI18n/)
})

test('editing a data item deep-clones canonical labels and icon rules', () => {
  const source = {
    id: 7,
    metricSymbol: ':FIELD_TYPE_STEPS',
    category: 'field',
    valueCode: 1,
    settingsLabel: { eng: 'Steps', zhs: '步数' },
    label: { eng: 'STEPS', zhs: '步数' },
    unitKey: 'none',
    iconUnicode: '',
    defaultValue: '0',
    isActive: 1,
    sortOrder: 1,
    description: '',
    iconRules: { type: 'enum', icons: { one: ':ICON_ONE' } },
  }
  const clone = cloneDataTypeForm(source)

  assert.deepEqual(clone, source)
  assert.notEqual(clone.settingsLabel, source.settingsLabel)
  assert.notEqual(clone.label, source.label)
  assert.notEqual(clone.iconRules, source.iconRules)
  assert.notEqual(clone.iconRules.icons, source.iconRules.icons)
})

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

test('data item payload deep-copies icon rules without mutating the form', () => {
  const form = {
    ...createEmptyDataTypeForm(),
    iconRules: {
      type: 'numeric',
      icons: { true: ':ICON_CHECK' },
      ranges: [{ min: 0, max: 10, icon: ':ICON_LOW' }],
    },
  }

  const payload = normalizeDataTypePayload(form)
  assert.notEqual(payload.iconRules, form.iconRules)
  assert.notEqual(payload.iconRules.icons, form.iconRules.icons)
  assert.notEqual(payload.iconRules.ranges, form.iconRules.ranges)
  assert.notEqual(payload.iconRules.ranges[0], form.iconRules.ranges[0])
  payload.iconRules.icons.true = ':ICON_CHANGED'
  payload.iconRules.ranges[0].icon = ':ICON_CHANGED'
  assert.deepEqual(form.iconRules, {
    type: 'numeric',
    icons: { true: ':ICON_CHECK' },
    ranges: [{ min: 0, max: 10, icon: ':ICON_LOW' }],
  })
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

test('unit normalization rejects __proto__ without prototype pollution and accepts regex-valid constructor', () => {
  const dangerousProto = JSON.parse('{"__proto__":{"aliases":["km"],"label":{"eng":"km","zhs":"公里"}}}')
  const validConstructor = {
    constructor: { aliases: ['km'], label: { eng: 'km', zhs: '公里' } },
  }
  const base = {
    unitKey: 'distance',
    name: 'Distance',
    defaultVariant: 'km',
    isActive: 1,
    sortOrder: 0,
  }

  assert.throws(
    () => normalizeUnitPayload({ ...base, variants: dangerousProto }),
    { message: 'distance.variantKey must match ^[a-z][a-z0-9_]*$' },
  )
  const constructorPayload = normalizeUnitPayload({
    ...base,
    defaultVariant: 'constructor',
    variants: validConstructor,
  })
  assert.equal(Object.getPrototypeOf(constructorPayload.variants), Object.prototype)
  assert.equal(Object.hasOwn(constructorPayload.variants, 'constructor'), true)
  assert.deepEqual(constructorPayload.variants.constructor, {
    aliases: ['km'],
    label: { eng: 'km', zhs: '公里' },
  })
  assert.equal({}.polluted, undefined)
})

test('unit normalization reports malformed variant shapes instead of throwing implementation errors', () => {
  const base = {
    unitKey: 'distance',
    name: 'Distance',
    defaultVariant: 'km',
    isActive: 1,
    sortOrder: 0,
  }

  assert.throws(
    () => normalizeUnitPayload({ ...base, variants: [] }),
    { message: 'distance.variants must be an object' },
  )
  assert.throws(
    () => normalizeUnitPayload({ ...base, variants: null }),
    { message: 'distance.variants must be an object' },
  )
  assert.throws(
    () => normalizeUnitPayload({ ...base, variants: { km: null } }),
    { message: 'distance.variants.km is required' },
  )
  assert.throws(
    () => normalizeUnitPayload({ ...base, variants: { km: [] } }),
    { message: 'distance.variants.km must be an object' },
  )
  assert.throws(
    () => normalizeUnitPayload({
      ...base,
      variants: { km: { aliases: null, label: { eng: 'km', zhs: '公里' } } },
    }),
    { message: 'distance.variants.km.aliases is required' },
  )
  assert.throws(
    () => normalizeUnitPayload({
      ...base,
      variants: { km: { aliases: 'km', label: { eng: 'km', zhs: '公里' } } },
    }),
    { message: 'distance.variants.km.aliases must be an array' },
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
  const units = [
    {
      unitKey: 'distance',
      name: 'Distance',
      defaultVariant: 'm',
      variants: { m: { aliases: ['z', 'm'], label: { eng: 'm', zhs: '米' } } },
      isActive: 1,
      sortOrder: 0,
    },
    {
      unitKey: 'length',
      name: 'Length',
      defaultVariant: 'meter',
      variants: { meter: { aliases: [' Z ', ' M '], label: { eng: 'm', zhs: '米' } } },
      isActive: 1,
      sortOrder: 1,
    },
  ]

  assert.equal(validateCatalogAliasOwnership(units), 'alias "m" is used by distance.m and length.meter')
  const reversedUnits = [...units].reverse().map(unit => ({
    ...unit,
    variants: Object.fromEntries(Object.entries(unit.variants).reverse().map(([key, variant]) => [
      key,
      { ...variant, aliases: [...variant.aliases].reverse() },
    ])),
  }))
  assert.equal(
    validateCatalogAliasOwnership(reversedUnits),
    'alias "m" is used by distance.m and length.meter',
  )
  assert.equal(validateUnitForm(units), 'alias "m" is used by distance.m and length.meter')
})
