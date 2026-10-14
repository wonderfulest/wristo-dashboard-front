export function analyticsCount(count, enabled, tracked, observed = true) {
  if (count > 0) return count
  if (!enabled) return '未启用'
  if (!tracked) return '暂无数据'
  return observed ? 0 : '等待回传'
}

export function analyticsRate(count, denominator, enabled = true, observed = true) {
  if (!enabled && count === 0) return '未启用'
  if (denominator > 0 && count === 0 && !observed) return '等待回传'
  return denominator > 0 ? `${(count / denominator * 100).toFixed(1)}%` : '暂无数据'
}
