/** Stable object comparison for displaying configuration changes. */
export function configSnapshot(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(configSnapshot).join(',')}]`
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${configSnapshot(item)}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'undefined'
}
