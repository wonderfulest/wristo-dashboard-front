export type DialMode = 'goal' | 'range' | null
export type DialGoalSource = 'garmin' | null

export interface DialFields {
  metricSymbol?: string
  dialMode?: DialMode
  dialMin?: number | null
  dialMax?: number | null
  dialGoalSource?: DialGoalSource
}

export function allowedDialMode(metricSymbol: unknown): Exclude<DialMode, null> | null
export function dialModeOptions(metricSymbol: unknown): DialMode[]
export function normalizeDialFields(form: DialFields): Required<Omit<DialFields, 'metricSymbol'>>
export function validateDialFields(form: DialFields): string
export function dialSummary(row: DialFields): string
