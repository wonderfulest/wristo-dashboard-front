const toLocalDate = (value) => {
  if (value instanceof Date) return new Date(value)
  const [year, month, day] = String(value).split(' ')[0].split('-').map(Number)
  return new Date(year, month - 1, day)
}

const formatLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const buildSelectedDayRange = (startValue, endValue) => {
  const start = toLocalDate(startValue)
  const endInclusive = toLocalDate(endValue)
  const endExclusive = new Date(endInclusive)
  endExclusive.setDate(endExclusive.getDate() + 1)
  const startDate = formatLocalDate(start)
  const endDate = formatLocalDate(endInclusive)
  return {
    startDate,
    endDate,
    displayPeriod: `[${startDate} 00:00, ${formatLocalDate(endExclusive)} 00:00)`,
  }
}

export const buildHistoricalDayRange = (dayOffset, now = new Date()) => {
  const day = new Date(now)
  day.setHours(0, 0, 0, 0)
  day.setDate(day.getDate() - dayOffset)
  return buildSelectedDayRange(day, day)
}

export const buildCompletedDayRange = (days, now = new Date()) => {
  const endExclusive = new Date(now)
  endExclusive.setHours(0, 0, 0, 0)
  const start = new Date(endExclusive)
  start.setDate(start.getDate() - days)
  const endInclusive = new Date(endExclusive)
  endInclusive.setDate(endInclusive.getDate() - 1)
  return buildSelectedDayRange(start, endInclusive)
}

export const buildRecentDayRange = (days, now = new Date()) => {
  const endInclusive = new Date(now)
  endInclusive.setHours(0, 0, 0, 0)
  const start = new Date(endInclusive)
  start.setDate(start.getDate() - days + 1)
  return buildSelectedDayRange(start, endInclusive)
}

export const buildCurrentDayRange = (now = new Date()) => {
  const current = new Date(now)
  const date = formatLocalDate(current)
  const hour = String(current.getHours()).padStart(2, '0')
  const minute = String(current.getMinutes()).padStart(2, '0')
  return {
    startDate: date,
    endDate: date,
    displayPeriod: `[${date} 00:00, ${date} ${hour}:${minute}]`,
  }
}
