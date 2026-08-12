import type { ApiResponse, PageResponse } from '@/types/api'
import type { Design, DesignPageQueryDTO } from '@/types/design'

type DesignPageRequest = (
  params: DesignPageQueryDTO
) => Promise<ApiResponse<PageResponse<Design>>>

export const searchDesigns = async (
  query: string,
  request: DesignPageRequest
): Promise<Design[]> => {
  const keyword = query.trim()
  if (!keyword) return []

  const response = await request({
    keyword,
    pageNum: 1,
    pageSize: 20,
    populate: 'product'
  })

  return response.code === 0 ? response.data?.list || [] : []
}
