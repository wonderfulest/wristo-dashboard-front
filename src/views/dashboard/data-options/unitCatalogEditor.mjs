const KEY_PATTERN = /^[a-z][a-z0-9_]*$/

export function createEmptyUnitForm() {
  return {
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
  }
}

export function cloneUnitForm(unit) {
  return {
    ...unit,
    variants: Object.fromEntries(Object.entries(unit?.variants ?? {}).map(([key, variant]) => [
      key,
      {
        aliases: [...(variant?.aliases ?? [])],
        label: { eng: variant?.label?.eng ?? '', zhs: variant?.label?.zhs ?? '' },
      },
    ])),
  }
}

export function renameVariant(form, oldKey, rawNewKey) {
  const newKey = String(rawNewKey ?? '').trim()
  if (!KEY_PATTERN.test(newKey)) return 'variantKey must match ^[a-z][a-z0-9_]*$'
  if (newKey !== oldKey && Object.hasOwn(form.variants, newKey)) return `variantKey ${newKey} already exists`
  if (newKey === oldKey) return null
  const next = {}
  for (const [key, variant] of Object.entries(form.variants)) next[key === oldKey ? newKey : key] = variant
  form.variants = next
  if (form.defaultVariant === oldKey) form.defaultVariant = newKey
  return null
}

export function commitVariantKeyDraft(form, drafts, oldKey, rawNewKey) {
  const error = renameVariant(form, oldKey, rawNewKey)
  if (error) {
    drafts[oldKey] = oldKey
    return error
  }
  const newKey = String(rawNewKey ?? '').trim()
  if (newKey !== oldKey) {
    delete drafts[oldKey]
    drafts[newKey] = newKey
  }
  return null
}

export function deleteVariant(form, key) {
  if (form.defaultVariant === key) return `Select another default variant before deleting ${key}`
  const { [key]: _removed, ...remaining } = form.variants
  form.variants = remaining
  return null
}

export function addVariant(form) {
  let suffix = 1
  let key = 'variant'
  while (Object.hasOwn(form.variants, key)) key = `variant_${suffix++}`
  form.variants = {
    ...form.variants,
    [key]: { aliases: [key], label: { eng: '', zhs: '' } },
  }
  if (!form.defaultVariant) form.defaultVariant = key
}

export function replaceUnitForm(target, source) {
  for (const key of Object.keys(target)) {
    if (!Object.hasOwn(source, key)) delete target[key]
  }
  Object.assign(target, source)
}

export function isInterceptorHandledError(error) {
  return !!error && typeof error === 'object'
    && (error.isAxiosError === true || (Object.hasOwn(error, 'code') && Object.hasOwn(error, 'msg')))
}
