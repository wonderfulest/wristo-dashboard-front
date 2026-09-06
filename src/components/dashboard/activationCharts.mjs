export const activationSources = [
  { key: 'directPurchaseCount', label: '直接购买', color: '#168456' },
  { key: 'existingBundleCount', label: '已有套餐权益', color: '#5573cc' },
  { key: 'existingAppCount', label: '已有单应用权益', color: '#b28a36' },
  { key: 'giftCount', label: '赠送', color: '#9b6bba' },
  { key: 'subscriptionCount', label: '订阅', color: '#40a6a0' },
  { key: 'unknownCount', label: '未知来源', color: '#929aa5' },
]

export const activationPercent = (count, total) => total > 0 ? Math.round(count / total * 10000) / 100 : 0

export function activationSummary(items) {
  return items.reduce((sum, item) => {
    for (const key of ['totalCount', 'codeCount', ...activationSources.map(source => source.key)]) {
      sum[key] = (sum[key] || 0) + Number(item[key] || 0)
    }
    return sum
  }, Object.fromEntries(['totalCount', 'codeCount', ...activationSources.map(source => source.key)].map(key => [key, 0])))
}

// Do not draw unavailable historical dates as observed zero activations.
const observed = (item, trackingStartedAt) => Boolean(trackingStartedAt) && item.date >= trackingStartedAt.slice(0, 10)

export function createActivationChart(items, trackingStartedAt, mode = 'trend') {
  const trend = mode === 'trend'
  const percent = mode === 'percent'
  const series = trend ? [
    { name: '六位码激活次数', type: 'line', data: items.map(item => observed(item, trackingStartedAt) ? item.codeCount : null), color: '#168456' },
    { name: '六位码去重应用数', type: 'line', data: items.map(item => observed(item, trackingStartedAt) ? item.codeAppCount : null), color: '#5573cc' },
  ] : activationSources.map(source => ({
    name: source.label, type: 'bar', stack: 'sources', color: source.color,
    data: items.map(item => observed(item, trackingStartedAt)
      ? percent ? activationPercent(item[source.key], item.totalCount) : item[source.key]
      : null),
  }))
  return {
    tooltip: { trigger: 'axis', valueFormatter: value => value == null ? '未采集' : percent ? `${value}%` : `${value}` },
    legend: { top: 0, type: 'scroll' },
    grid: { left: 45, right: 20, top: 55, bottom: 60, containLabel: true },
    xAxis: { type: 'category', data: items.map(item => item.date) },
    yAxis: { type: 'value', name: percent ? '占比 %' : '数量', ...(percent ? { max: 100 } : { minInterval: 1 }) },
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 5 }],
    series,
  }
}
