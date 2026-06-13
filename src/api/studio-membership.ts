import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type {
  StudioMembershipMember,
  StudioMembershipPageQuery,
  StudioMembershipSummaryItem,
} from '@/types/studio-membership'

export const fetchStudioMembershipSummary = (): Promise<ApiResponse<StudioMembershipSummaryItem[]>> => {
  return instance.get('/admin/studio/memberships/summary')
}

export const fetchStudioMembershipPage = (
  params: StudioMembershipPageQuery
): Promise<ApiResponse<PageResponse<StudioMembershipMember>>> => {
  return instance.get('/admin/studio/memberships/page', { params })
}
