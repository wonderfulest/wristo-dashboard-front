export const reviewCategories = [
  { key: 'designs', label: '设计审核', note: '已提交的表盘设计', path: '/packaging/design-review' },
  { key: 'posts', label: 'Looks 作品审核', note: '待发布的图片与视频', path: '/looks/reviews?type=posts&state=pending' },
  { key: 'comments', label: 'Looks 评论审核', note: '待公开的评论与回复', path: '/looks/reviews?type=comments&state=pending' },
  { key: 'reports', label: 'Looks 举报处理', note: '尚未处理的内容举报', path: '/looks/reports' },
  { key: 'social', label: '社交分享奖励审核', note: '待核实的分享奖励申请', path: '/ops/reward-records?tab=social' },
]

export function requireCount(response, key) {
  const value = response?.data?.[key]
  if (response?.code !== 0 || typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error('Invalid review count')
  }
  return value
}

export async function loadReviewCounts(loaders) {
  const results = await Promise.allSettled(reviewCategories.map(item => Promise.resolve().then(() => loaders[item.key]())))
  return Object.fromEntries(reviewCategories.map((item, index) => {
    const result = results[index]
    return [item.key, result.status === 'fulfilled' ? { count: result.value, error: false } : { count: null, error: true }]
  }))
}
