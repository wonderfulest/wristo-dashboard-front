export const registrationSourceLabels = {
  studio: 'Studio', store: 'Store', cn: '中国站', ios: 'iOS', android: 'Android',
  wechat_miniprogram: '微信小程序', xiaohongshu_miniprogram: '小红书小程序',
  sso: 'SSO', web: 'Web', dashboard: '管理后台', merchant: '商家中心', growth: 'Growth',
  admin: '后台建号', paddle: 'Paddle', crm: 'CRM', mall: '商城', order: '订单', unknown: '未知',
}
export const registrationMethodLabels = {
  email: '邮箱', google: 'Google', apple: 'Apple', wechat: '微信', xiaohongshu: '小红书',
  system: '系统建号', unknown: '未知',
}

// Only the overview's explicit, typed filters can enter the existing user-list request.
export function parseOverviewFilters(query) {
  if (query.overview !== '1') return {}
  const result = { isDeleted: 0 }
  for (const key of ['registrationSource', 'registrationMethod']) {
    if (typeof query[key] === 'string' && query[key].trim() && query[key].length <= 64)
      result[key] = query[key].trim().toLowerCase()
  }
  for (const key of ['createdFrom', 'createdBefore', 'loginFrom', 'loginBefore']) {
    if (typeof query[key] === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,6})?$/.test(query[key]))
      result[key] = query[key]
  }
  for (const key of ['emailVerified', 'neverLoggedIn', 'noRole']) {
    if (query[key] === 'true' || query[key] === 'false') result[key] = query[key] === 'true'
  }
  if (query.status === '0' || query.status === '1') result.status = Number(query.status)
  if (typeof query.roleId === 'string' && /^\d+$/.test(query.roleId) && Number.isSafeInteger(Number(query.roleId)) && Number(query.roleId) > 0)
    result.roleId = Number(query.roleId)
  return result
}

export function overviewUserRoute(filters, label) {
  return {
    path: '/users/user-management',
    query: { overview: '1', overviewLabel: label, ...Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, String(value)])) },
  }
}
