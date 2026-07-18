export interface NaturalDayRange {
  startDate: string
  endDate: string
  displayPeriod: string
}

export function buildHistoricalDayRange(dayOffset: number, now?: Date): NaturalDayRange
export function buildCompletedDayRange(days: number, now?: Date): NaturalDayRange
export function buildSelectedDayRange(start: string | Date, end: string | Date): NaturalDayRange
export function buildRecentDayRange(days: number, now?: Date): NaturalDayRange
export function buildCurrentDayRange(now?: Date): NaturalDayRange
