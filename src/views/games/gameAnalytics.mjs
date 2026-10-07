export function shanghaiDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
export function recentRange(days = 30, now = new Date()) {
  const to = shanghaiDate(now)
  const from = new Date(`${to}T00:00:00Z`)
  from.setUTCDate(from.getUTCDate() - days + 1)
  return [from.toISOString().slice(0, 10), to]
}
export function leaderboardMode(key, mode, day) {
  return key === 'daily-lights' ? `daily${day.replaceAll('-', '')}` : mode
}
export function formatGameScore(value, metric) {
  if (value == null) return '—'
  const units = { errorMs: 'ms', points: '分', hits: '次', steps: '轮', lengthMm: 'mm', nights: '晚', stars: '星', floors: '层', altitude: '级', dodges: '次', gold: '金币', trailPoints: '分', dailyPoints: '分', golfPoints: '分', safePoints: '分' }
  return `${value.toLocaleString('zh-CN')} ${units[metric] || ''}`.trim()
}
