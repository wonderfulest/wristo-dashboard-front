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

export function cloneDataTypeForm(value) {
  return {
    ...value,
    settingsLabel: normalizeLocalizedText(value?.settingsLabel),
    label: normalizeLocalizedText(value?.label),
    iconRules: normalizeIconRules(value?.iconRules),
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
    iconRules: normalizeIconRules(form.iconRules),
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
  const validationError = validateUnitDefinition(form)
  if (validationError) throw new Error(validationError)
  const aliasError = validateCatalogAliasOwnership([form])
  if (aliasError) throw new Error(aliasError)

  const unitKey = trim(form.unitKey)
  const variants = []
  for (const [rawKey, rawVariant] of sortedEntries(form.variants)) {
    const variantKey = trim(rawKey)
    variants.push([
      variantKey,
      {
        aliases: [...new Set(rawVariant.aliases.map(alias => trim(alias).toLowerCase()))].sort(),
        label: normalizeLocalizedText(rawVariant.label),
      },
    ])
  }
  return {
    ...(form.id === undefined || form.id === null ? {} : { id: Number(form.id) }),
    unitKey,
    name: trim(form.name),
    defaultVariant: form.defaultVariant === null || trim(form.defaultVariant) === ''
      ? null
      : trim(form.defaultVariant),
    variants: Object.fromEntries(variants),
    isActive: Number(form.isActive),
    sortOrder: Number(form.sortOrder),
    description: trim(form.description),
  }
}

export function validateUnitForm(value) {
  const units = Array.isArray(value) ? value : [value]
  for (const rawUnit of units) {
    const error = validateUnitDefinition(rawUnit)
    if (error) return error
  }
  return validateCatalogAliasOwnership(units)
}

export function validateCatalogAliasOwnership(value) {
  const units = Array.isArray(value) ? value : [value]
  const aliases = []
  for (const unit of units) {
    const shapeError = validateUnitDefinition(unit)
    if (shapeError) return shapeError
    const unitKey = trim(unit.unitKey)
    for (const [rawVariantKey, variant] of sortedEntries(unit.variants)) {
      const owner = `${unitKey}.${trim(rawVariantKey)}`
      for (const rawAlias of variant.aliases) {
        aliases.push({ alias: trim(rawAlias).toLowerCase(), owner })
      }
    }
  }
  aliases.sort((left, right) => left.owner.localeCompare(right.owner) || left.alias.localeCompare(right.alias))
  const owners = new Map()
  for (const current of aliases) {
    const previous = owners.get(current.alias)
    if (previous && previous !== current.owner) {
      return `alias "${current.alias}" is used by ${previous} and ${current.owner}`
    }
    owners.set(current.alias, current.owner)
  }
  return null
}

function validateUnitDefinition(rawUnit) {
  if (!isPlainRecord(rawUnit)) return 'unit must be an object'
  const unitKey = trim(rawUnit.unitKey)
  const unitKeyError = validateKey(unitKey, 'unitKey')
  if (unitKeyError) return unitKeyError
  if (!trim(rawUnit.name)) return `${unitKey}.name is required`
  if (rawUnit.isActive !== 0 && rawUnit.isActive !== 1) return 'isActive must be 0 or 1'
  if (!Number.isInteger(rawUnit.sortOrder) || rawUnit.sortOrder < 0) return 'sortOrder must be nonnegative'
  if (!isPlainRecord(rawUnit.variants)) return `${unitKey}.variants must be an object`

  const rawDefault = rawUnit.defaultVariant === null || rawUnit.defaultVariant === undefined
    ? null
    : trim(rawUnit.defaultVariant)
  if (unitKey === 'none') {
    if (Object.keys(rawUnit.variants).length) return 'none.variants must be empty'
    if (rawDefault) return 'none.defaultVariant must be null'
    return null
  }
  if (rawUnit.isActive === 1 && Object.keys(rawUnit.variants).length === 0) {
    return `${unitKey}.variants is required`
  }

  const variantKeys = new Set()
  for (const [rawVariantKey, variant] of sortedEntries(rawUnit.variants)) {
    const variantKey = trim(rawVariantKey)
    const keyError = validateKey(variantKey, `${unitKey}.variantKey`)
    if (keyError) return keyError
    if (variantKeys.has(variantKey)) {
      return `${unitKey}.variantKey '${variantKey}' is duplicated after normalization`
    }
    variantKeys.add(variantKey)
    const path = `${unitKey}.variants.${variantKey}`
    if (variant === null || variant === undefined) return `${path} is required`
    if (!isPlainRecord(variant)) return `${path} must be an object`
    const labelError = validateLocalizedText(variant.label, `${path}.label`)
    if (labelError) return labelError
    if (variant.aliases === null || variant.aliases === undefined || variant.aliases.length === 0) {
      return `${path}.aliases is required`
    }
    if (!Array.isArray(variant.aliases)) return `${path}.aliases must be an array`
    for (const alias of variant.aliases) {
      if (typeof alias !== 'string' || !alias.trim()) {
        return `${path}.aliases must not contain blank values`
      }
    }
  }

  if (rawDefault !== null) {
    const defaultError = validateKey(rawDefault, `${unitKey}.defaultVariant`)
    if (defaultError) return defaultError
  }
  if ((rawUnit.isActive === 1 || rawDefault !== null) && !variantKeys.has(rawDefault)) {
    return `${unitKey}.defaultVariant must reference an existing variant`
  }
  return null
}

function normalizeLocalizedText(value) {
  return { eng: trim(value?.eng), zhs: trim(value?.zhs) }
}

function normalizeIconRules(value) {
  if (value === null || value === undefined) return value
  const normalized = { type: value.type }
  if (isPlainRecord(value.icons)) {
    normalized.icons = Object.fromEntries(sortedEntries(value.icons))
  }
  if (Array.isArray(value.ranges)) {
    normalized.ranges = value.ranges.map(range => ({
      min: range?.min,
      max: range?.max,
      icon: range?.icon,
    }))
  }
  return normalized
}

function isPlainRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function sortedEntries(value) {
  return Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
}

function validateKey(value, path) {
  return KEY_PATTERN.test(value) ? null : `${path} must match ^[a-z][a-z0-9_]*$`
}

function trim(value) {
  return String(value ?? '').trim()
}
