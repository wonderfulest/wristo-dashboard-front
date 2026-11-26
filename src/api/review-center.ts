import instance from '@/config/axios'
import { fetchDesignReviewPage } from '@/api/design-review'
import { getApplications } from '@/api/promoter-applications'
import { socialRewardsApi } from '@/api/socialRewards'
import { loadReviewCounts, requireCount } from '@/components/dashboard/reviewCenter.mjs'
import type { ApiResponse } from '@/types/api'

export function fetchReviewCounts() {
  const looks = instance.get<never, ApiResponse<{ posts: number; comments: number; reports: number }>>('/admin/looks/pending-counts')
  return loadReviewCounts({
    designs: async () => requireCount(await fetchDesignReviewPage({ pageNum: 1, pageSize: 1, designStatus: 'submitted' }), 'total'),
    posts: async () => requireCount(await looks, 'posts'),
    comments: async () => requireCount(await looks, 'comments'),
    reports: async () => requireCount(await looks, 'reports'),
    promoterApplications: async () => requireCount(await getApplications(1, 1, 'pending'), 'total'),
    social: async () => requireCount(await socialRewardsApi.list(1, 'PENDING'), 'total'),
  })
}
