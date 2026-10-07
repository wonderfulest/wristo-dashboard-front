export const activationPlatforms = [
  { value: 'WRISTO_IO', label: 'wristo.io' },
  { value: 'WRISTO_CN', label: 'wristo.cn' },
  { value: 'IOS', label: 'iOS' },
  { value: 'GOOGLE_PLAY', label: 'Google Play' },
  { value: 'MINI_PROGRAM', label: '小程序' },
  { value: 'UNKNOWN', label: '未知' },
]
export function activationPlatformLabel(value, miniProgram) {
  const label = activationPlatforms.find(item => item.value === value)?.label || '未知'
  if (value !== 'MINI_PROGRAM') return label
  return miniProgram === 'WECHAT' ? '微信小程序' : miniProgram === 'XIAOHONGSHU' ? '小红书小程序' : label
}
export function platformSummary(items = []) {
  return activationPlatforms.map(platform => ({ ...platform,
    activationCount: items.find(item => item.activationPlatform === platform.value)?.activationCount || 0,
    userCount: items.find(item => item.activationPlatform === platform.value)?.userCount || 0,
  }))
}
export function platformTrend(dates, items, selected = '') {
  const counts = new Map(items.map(item => [`${item.date}:${item.activationPlatform}`, item.activationCount]))
  return {
    tooltip: { trigger: 'axis' }, legend: { bottom: 0 },
    grid: { left: 45, right: 20, top: 20, bottom: 70 },
    xAxis: { type: 'category', data: dates }, yAxis: { type: 'value', minInterval: 1 },
    series: activationPlatforms.filter(item => !selected || item.value === selected).map(platform => ({
      name: platform.label, type: 'line', showSymbol: dates.length === 1,
      data: dates.map(date => counts.get(`${date}:${platform.value}`) || 0),
    })),
  }
}
