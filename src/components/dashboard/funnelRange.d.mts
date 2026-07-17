export interface NaturalDayRange {
  startDate: string
  endDate: string
  displayPeriod: string
}

export function buildCompletedDayRange(days: number, now?: Date): NaturalDayRange
export function buildSelectedDayRange(start: string | Date, end: string | Date): NaturalDayRange
