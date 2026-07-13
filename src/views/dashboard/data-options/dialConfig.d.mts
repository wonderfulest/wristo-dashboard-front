export type DialMode = 'goal' | 'range' | null
export type DialGoalSource = 'garmin' | 'fixed' | null

export interface DialFields {
  dialMode?: DialMode
  dialMin?: number | null
  dialMax?: number | null
  dialGoalSource?: DialGoalSource
}

export function normalizeDialFields(form: DialFields): Required<DialFields>
export function validateDialFields(form: DialFields): string
export function dialSummary(row: DialFields): string
