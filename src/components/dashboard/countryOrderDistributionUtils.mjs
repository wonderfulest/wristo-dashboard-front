const formatLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseLocalDate = (value) => {
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, month - 1, day)
}

const subtractCalendarMonth = (date) => {
  const targetYear = date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear()
  const targetMonth = date.getMonth() === 0 ? 11 : date.getMonth() - 1
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate()
  return new Date(targetYear, targetMonth, Math.min(date.getDate(), lastDay))
}

export const buildDefaultCountryOrderRange = (now = new Date()) => {
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return [formatLocalDate(subtractCalendarMonth(endDate)), formatLocalDate(endDate)]
}

export const clampCountryOrderRange = (range) => {
  const [startValue, endValue] = range
  const startDate = parseLocalDate(startValue)
  const endDate = parseLocalDate(endValue)
  const minStartDate = subtractCalendarMonth(endDate)
  const clamped = startDate < minStartDate
  return {
    range: [formatLocalDate(clamped ? minStartDate : startDate), formatLocalDate(endDate)],
    clamped,
  }
}

export const formatCountryLabel = (countryCode, displayNames) => {
  const normalizedCode = String(countryCode || '').trim().toUpperCase()
  if (!normalizedCode || normalizedCode === 'UNKNOWN') return '未知'
  try {
    const name = displayNames?.of(normalizedCode)
    return name ? `${name}（${normalizedCode}）` : normalizedCode
  } catch {
    return normalizedCode
  }
}
