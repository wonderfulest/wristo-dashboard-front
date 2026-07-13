const MODES = new Set(['goal', 'range'])

export function normalizeDialFields(form) {
  const mode = MODES.has(form?.dialMode) ? form.dialMode : null
  if (mode === 'goal') {
    return {
      dialMode: mode,
      dialMin: null,
      dialMax: null,
      dialGoalSource: form?.dialGoalSource || null,
    }
  }
  if (mode === 'range') {
    return {
      dialMode: mode,
      dialMin: finiteNumber(form?.dialMin),
      dialMax: finiteNumber(form?.dialMax),
      dialGoalSource: null,
    }
  }
  return { dialMode: null, dialMin: null, dialMax: null, dialGoalSource: null }
}

export function validateDialFields(form) {
  const value = normalizeDialFields(form)
  if (value.dialMode === 'goal' && !value.dialGoalSource) {
    return 'Goal source is required'
  }
  if (value.dialMode === 'range') {
    if (value.dialMin === null || value.dialMax === null) {
      return 'Range minimum and maximum are required'
    }
    if (value.dialMax <= value.dialMin) {
      return 'Range maximum must be greater than minimum'
    }
  }
  return ''
}

export function dialSummary(row) {
  const value = normalizeDialFields(row)
  if (value.dialMode === 'goal') {
    const source = value.dialGoalSource === 'garmin' ? 'Garmin' : value.dialGoalSource || '—'
    return `Goal · ${source}`
  }
  if (value.dialMode === 'range') {
    if (value.dialMin === null || value.dialMax === null) return 'Range · Invalid'
    return `Range · ${value.dialMin}–${value.dialMax}`
  }
  return '—'
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}
