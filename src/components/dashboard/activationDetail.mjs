export const activationDetailRoute = email => ({ path: '/dashboard/activations/user', query: { email: email.trim().toLowerCase() } })
export const activationTime = value => value ? value.replace('T', ' ').replace(/\.\d+$/, '') + ' UTC' : '未知（历史未记录）'
export const activationSourceLabel = source => ({ DIRECT_PURCHASE: '直接购买', EXISTING_BUNDLE: '已有套餐权益',
  EXISTING_APP: '已有单应用权益', GIFT: '赠送', SUBSCRIPTION: '订阅', UNKNOWN: '未知来源' }[source] || '未知来源')
export function activationLocation(item) {
  const parts = [item.countryName || item.countryCode, item.region, item.city].filter(value => value?.trim())
  const place = [...new Set(parts)].join(' · ')
  if (!place || !['ACTIVATION_REQUEST', 'CHECKOUT_REQUEST'].includes(item.locationSource)) return { place: '未知（未采集）', label: '' }
  return { place, label: item.locationSource === 'CHECKOUT_REQUEST' ? '下单请求 IP 推测位置' : '激活请求 IP 推测位置' }
}

export function activationAssetUrl(value) {
  if (!value) return ''
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : ''
  } catch { return '' }
}
