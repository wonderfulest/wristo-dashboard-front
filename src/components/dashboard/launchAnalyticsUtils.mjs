export function attributedRevenueCents(cohort) {
  return Number(cohort?.directRevenueCents || 0)
    + Number(cohort?.bundleRevenueCents || 0)
    - Number(cohort?.refundCents || 0)
}

export function contributionsAreConserved(contributions) {
  return Object.values(contributions || {}).every((cohort) =>
    attributedRevenueCents(cohort) === Number(cohort?.attributedRevenueCents || 0))
}

export function formatUsdCents(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `$${(Number(value) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function recommendationRangeLabel(recommendation) {
  const minimum = recommendation?.recommendedMinLaunches
  const maximum = recommendation?.recommendedMaxLaunches
  if (minimum === null || minimum === undefined || maximum === null || maximum === undefined) {
    return '证据不足'
  }
  return `${minimum}–${maximum} 款/天`
}

export function modelStatusLabel(response) {
  if (response?.partial) return '实时数据，不参与训练'
  if (response?.status === 'EVIDENCE_INSUFFICIENT' || response?.status === 'NO_SUCCESSFUL_MODEL') {
    return response.status === 'NO_SUCCESSFUL_MODEL' ? '暂无成功模型' : '样本不足'
  }
  return '已完成历史训练'
}

const QUADRANT_LABELS = {
  STAR: '高规模 / 高效率',
  SCALE: '高规模 / 低效率',
  NICHE: '低规模 / 高效率',
  LOW_VALUE: '低规模 / 低效率',
}

export function quadrantLabel(quadrant) {
  return QUADRANT_LABELS[quadrant] || quadrant || '—'
}
