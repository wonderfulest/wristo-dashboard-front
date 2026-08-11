export function formatProcessingDuration(
  durationMs: number | null | undefined,
  processingStartedAt: string | number | Date | null | undefined,
): string {
  if (durationMs === null || durationMs === undefined) {
    return processingStartedAt ? '处理中' : '-'
  }

  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}秒`)
  return parts.join(' ')
}
