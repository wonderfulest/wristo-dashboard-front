const MODES = new Set(['goal', 'range'])
const GOAL_SYMBOLS = new Set([
  ':GOAL_TYPE_STEPS',
  ':GOAL_TYPE_FLOORS_CLIMBED',
  ':GOAL_TYPE_WEEKLY_ACTIVE_MINUTES',
])
const RANGE_SYMBOLS = new Set([
  ':FIELD_TYPE_BATTERY',
  ':FIELD_TYPE_BODY_BATTERY',
  ':FIELD_TYPE_STRESS',
  ':FIELD_TYPE_PULSE_OX',
  ':FIELD_TYPE_WEATHER_HUMIDITY',
  ':FIELD_TYPE_WEATHER_CLOUDS',
  ':FIELD_TYPE_SLEEP_SCORE',
])

export function allowedDialMode(metricSymbol) {
  const symbol = String(metricSymbol ?? '').trim()
  if (GOAL_SYMBOLS.has(symbol)) return 'goal'
  if (RANGE_SYMBOLS.has(symbol)) return 'range'
  return null
}

export function dialModeOptions(metricSymbol) {
  const approved = allowedDialMode(metricSymbol)
  return approved ? [null, approved] : [null]
}

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
  const approvedMode = allowedDialMode(form?.metricSymbol)
  if (value.dialMode && form?.metricSymbol && !approvedMode) return 'Data type is not approved for Dial'
  if (value.dialMode && approvedMode && value.dialMode !== approvedMode) {
    return `Data type is approved for ${approvedMode === 'goal' ? 'Goal' : 'Range'} Dial only`
  }
  if (value.dialMode === 'goal' && value.dialGoalSource !== 'garmin') {
    return value.dialGoalSource ? 'Goal Dial requires Garmin goal source' : 'Goal source is required'
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
