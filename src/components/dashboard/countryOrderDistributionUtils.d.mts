export type CountryOrderDateRange = [string, string]

export interface ClampedCountryOrderRange {
  range: CountryOrderDateRange
  clamped: boolean
}

export interface RegionDisplayNames {
  of(code: string): string | undefined
}

export function buildDefaultCountryOrderRange(now?: Date): CountryOrderDateRange
export function clampCountryOrderRange(range: CountryOrderDateRange): ClampedCountryOrderRange
export function formatCountryLabel(countryCode: string, displayNames?: RegionDisplayNames | null): string
