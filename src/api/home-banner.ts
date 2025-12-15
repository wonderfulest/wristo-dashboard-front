import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { HomeBannerCreateDTO, HomeBannerPageQueryDTO, HomeBannerUpdateDTO, HomeBannerVO } from '@/types/home-banner'

export const createHomeBanner = (data: HomeBannerCreateDTO): Promise<ApiResponse<HomeBannerVO>> => {
  return instance.post('/admin/website/home-banners', data)
}

export const updateHomeBanner = (data: HomeBannerUpdateDTO): Promise<ApiResponse<HomeBannerVO>> => {
  return instance.put('/admin/website/home-banners', data)
}

export const deleteHomeBanner = (id: number): Promise<ApiResponse<boolean>> => {
  return instance.delete(`/admin/website/home-banners/${id}`)
}

export const getHomeBannerById = (id: number): Promise<ApiResponse<HomeBannerVO>> => {
  return instance.get(`/admin/website/home-banners/${id}`)
}

export const pageHomeBanners = (params: HomeBannerPageQueryDTO): Promise<ApiResponse<PageResponse<HomeBannerVO>>> => {
  return instance.get('/admin/website/home-banners/page?populate=image', { params })
}

export const activateHomeBanner = (id: number, isActive: number): Promise<ApiResponse<boolean>> => {
  return instance.post(`/admin/website/home-banners/${id}/activate`, null, { params: { isActive } })
}
