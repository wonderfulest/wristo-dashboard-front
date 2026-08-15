const pad = (value) => String(value).padStart(2, '0')

const formatDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const buildDashboardRange = (rangeType = '7d', now = new Date()) => {
  const days = Number.parseInt(rangeType, 10) || 7
  const end = new Date(now)
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setDate(end.getDate() - days + 1)
  const startDate = formatDate(start)
  const endDate = formatDate(end)
  return { startDate, endDate, displayPeriod: `${startDate} 至 ${endDate}` }
}

export const calculateBusinessMetrics = (sales = [], funnel = null) => {
  const totals = sales.reduce((result, item) => ({
    revenue: result.revenue + (Number(item?.earnings) || 0) / 100,
    orders: result.orders + (Number(item?.orderCount) || 0),
    downloads: result.downloads + (Number(item?.downloads) || 0),
  }), { revenue: 0, orders: 0, downloads: 0 })
  const downloads = Number(funnel?.downloads) || totals.downloads
  const purchases = (Number(funnel?.appPurchases) || 0) + (Number(funnel?.bundlePurchases) || 0)
  return {
    ...totals,
    downloads,
    purchaseRate: downloads > 0 ? purchases * 100 / downloads : null,
  }
}

export const formatDashboardMetric = (key, value) => {
  if (value === null || value === undefined) return '-'
  if (key === 'revenue') return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (key === 'purchaseRate') return `${Number(value).toFixed(1)}%`
  return Number(value).toLocaleString('en-US')
}
