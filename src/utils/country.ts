const countryDisplayNames = typeof Intl.DisplayNames === 'function'
  ? new Intl.DisplayNames(['zh-CN'], { type: 'region' })
  : null

const countryNameDictionary: Record<string, string> = {}

export const getCountryName = (countryCode?: string | null): string => {
  const normalizedCode = String(countryCode || '').trim().toUpperCase()
  if (!normalizedCode) return ''

  if (countryNameDictionary[normalizedCode]) {
    return countryNameDictionary[normalizedCode]
  }

  try {
    const countryName = countryDisplayNames?.of(normalizedCode)
    if (countryName && countryName !== normalizedCode) {
      countryNameDictionary[normalizedCode] = countryName
      return countryName
    }
  } catch {
    // Invalid or non-standard country codes fall back to the original value.
  }

  return normalizedCode
}

export const formatCountry = (countryCode?: string | null): string => {
  const normalizedCode = String(countryCode || '').trim().toUpperCase()
  if (!normalizedCode) return '-'

  const countryName = getCountryName(normalizedCode)
  return countryName === normalizedCode
    ? normalizedCode
    : `${countryName} (${normalizedCode})`
}
