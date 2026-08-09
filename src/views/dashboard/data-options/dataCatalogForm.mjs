const KEY_PATTERN = /^[a-z][a-z0-9_]*$/
const SYMBOL_PATTERN = /^:[A-Z][A-Z0-9_]*$/
const CATEGORIES = new Set(['field', 'goal', 'chart', 'indicator', 'date'])

export function createEmptyDataTypeForm() {
  return {
    id: undefined,
    metricSymbol: '',
    category: 'field',
    valueCode: 0,
    settingsLabel: { eng: '', zhs: '' },
    label: { eng: '', zhs: '' },
    unitKey: 'none',
    iconUnicode: '',
    defaultValue: '',
    isActive: 1,
    sortOrder: 1,
    description: '',
    iconRules: undefined,
    dialMode: null,
    dialMin: null,
    dialMax: null,
    dialGoalSource: null,
  }
}

export function validateLocalizedText(value, path) {
  if (!String(value?.eng ?? '').trim()) return `${path}.eng is required`
  if (!String(value?.zhs ?? '').trim()) return `${path}.zhs is required`
  return null
}

export function normalizeDataTypePayload(form) {
  const payload = {
    metricSymbol: trim(form.metricSymbol),
    category: form.category,
    valueCode: Number(form.valueCode),
    settingsLabel: normalizeLocalizedText(form.settingsLabel),
    label: normalizeLocalizedText(form.label),
    unitKey: trim(form.unitKey),
    iconUnicode: trim(form.iconUnicode),
    defaultValue: trim(form.defaultValue),
    isActive: Number(form.isActive),
    sortOrder: Number(form.sortOrder),
    description: trim(form.description),
    iconRules: form.iconRules,
    dialMode: form.dialMode ?? null,
    dialMin: form.dialMin ?? null,
    dialMax: form.dialMax ?? null,
    dialGoalSource: form.dialGoalSource ?? null,
  }
  if (form.id !== undefined && form.id !== null) payload.id = Number(form.id)
  return payload
}

export function validateDataTypeForm(form) {
  const normalized = normalizeDataTypePayload(form)
  const settingsError = validateLocalizedText(normalized.settingsLabel, 'settingsLabel')
  if (settingsError) return settingsError
  const labelError = validateLocalizedText(normalized.label, 'label')
  if (labelError) return labelError
  if (!Number.isInteger(normalized.valueCode) || normalized.valueCode < 0) {
    return 'valueCode must be nonnegative'
  }
  if (!SYMBOL_PATTERN.test(normalized.metricSymbol)) {
    return 'metricSymbol must match ^:[A-Z][A-Z0-9_]*$'
  }
  if (!CATEGORIES.has(normalized.category)) return 'category is unsupported'
  const unitError = validateKey(normalized.unitKey, 'unitKey')
  if (unitError) return unitError
  if (normalized.isActive !== 0 && normalized.isActive !== 1) return 'isActive must be 0 or 1'
  if (!Number.isInteger(normalized.sortOrder) || normalized.sortOrder < 0) {
    return 'sortOrder must be nonnegative'
  }
  return null
}

export function normalizeUnitPayload(form) {
  const unitKey = trim(form.unitKey)
  const variants = {}
  for (const [rawKey, rawVariant] of Object.entries(form.variants ?? {})) {
    const variantKey = trim(rawKey)
    variants[variantKey] = {
      aliases: [...new Set((rawVariant?.aliases ?? []).map(alias => trim(alias).toLowerCase()))].sort(),
      label: normalizeLocalizedText(rawVariant?.label),
    }
  }
  return {
    ...(form.id === undefined || form.id === null ? {} : { id: Number(form.id) }),
    unitKey,
    name: trim(form.name),
    defaultVariant: form.defaultVariant === null || trim(form.defaultVariant) === ''
      ? null
      : trim(form.defaultVariant),
    variants: Object.fromEntries(Object.entries(variants).sort(([left], [right]) => left.localeCompare(right))),
    isActive: Number(form.isActive),
    sortOrder: Number(form.sortOrder),
    description: trim(form.description),
  }
}

export function validateUnitForm(value) {
  const units = Array.isArray(value) ? value : [value]
  const owners = new Map()

  for (const rawUnit of units) {
    const rawUnitKey = trim(rawUnit?.unitKey)
    const unitKeyError = validateKey(rawUnitKey, 'unitKey')
    if (unitKeyError) return unitKeyError
    if (!trim(rawUnit?.name)) return `${rawUnitKey}.name is required`
    if (rawUnit?.isActive !== 0 && rawUnit?.isActive !== 1) return 'isActive must be 0 or 1'
    if (!Number.isInteger(rawUnit?.sortOrder) || rawUnit.sortOrder < 0) {
      return 'sortOrder must be nonnegative'
    }

    const rawVariants = rawUnit?.variants ?? {}
    const rawDefault = rawUnit?.defaultVariant === null || rawUnit?.defaultVariant === undefined
      ? null
      : trim(rawUnit.defaultVariant)
    if (rawUnitKey === 'none') {
      if (Object.keys(rawVariants).length) return 'none.variants must be empty'
      if (rawDefault) return 'none.defaultVariant must be null'
      continue
    }
    if (rawUnit.isActive === 1 && Object.keys(rawVariants).length === 0) {
      return `${rawUnitKey}.variants is required`
    }

    const normalizedVariantKeys = new Set()
    for (const [rawVariantKey, variant] of Object.entries(rawVariants)) {
      const variantKey = trim(rawVariantKey)
      const variantKeyError = validateKey(variantKey, `${rawUnitKey}.variantKey`)
      if (variantKeyError) return variantKeyError
      if (normalizedVariantKeys.has(variantKey)) {
        return `${rawUnitKey}.variantKey '${variantKey}' is duplicated after normalization`
      }
      normalizedVariantKeys.add(variantKey)
      const path = `${rawUnitKey}.variants.${variantKey}`
      if (!variant) return `${path} is required`
      const labelError = validateLocalizedText(variant.label, `${path}.label`)
      if (labelError) return labelError
      if (!Array.isArray(variant.aliases) || variant.aliases.length === 0) {
        return `${path}.aliases is required`
      }
      for (const rawAlias of variant.aliases) {
        const alias = trim(rawAlias).toLowerCase()
        if (!alias) return `${path}.aliases must not contain blank values`
        const owner = `${rawUnitKey}.${variantKey}`
        const previous = owners.get(alias)
        if (previous && previous !== owner) return `alias "${alias}" is used by ${previous} and ${owner}`
        owners.set(alias, owner)
      }
    }

    const defaultVariant = rawDefault
    if (defaultVariant !== null) {
      const defaultError = validateKey(defaultVariant, `${rawUnitKey}.defaultVariant`)
      if (defaultError) return defaultError
    }
    if ((rawUnit.isActive === 1 || defaultVariant !== null) && !normalizedVariantKeys.has(defaultVariant)) {
      return `${rawUnitKey}.defaultVariant must reference an existing variant`
    }
  }
  return null
}

function normalizeLocalizedText(value) {
  return { eng: trim(value?.eng), zhs: trim(value?.zhs) }
}

function validateKey(value, path) {
  return KEY_PATTERN.test(value) ? null : `${path} must match ^[a-z][a-z0-9_]*$`
}

function trim(value) {
  return String(value ?? '').trim()
}
