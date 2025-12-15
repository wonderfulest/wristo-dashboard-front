import type { PageQueryDTO } from '@/types/common'
import type { ImageVO } from '@/types/image'

export interface HomeBannerVO {
  id: number
  imageId?: number | null
  image?: ImageVO | null
  linkType: string
  linkUrl: string
  openTarget?: string | null
  sortOrder?: number | null
  remark?: string | null
  clickCount?: number | null
  isActive: number
  createdAt?: string
  updatedAt?: string
}

export interface HomeBannerCreateDTO {
  imageId: number
  linkType: string
  linkUrl: string
  openTarget?: string
  sortOrder?: number
  remark?: string
  isActive?: number
}

export interface HomeBannerUpdateDTO {
  id: number
  imageId?: number
  linkType?: string
  linkUrl?: string
  openTarget?: string
  sortOrder?: number
  remark?: string
  isActive?: number
}

export interface HomeBannerPageQueryDTO extends PageQueryDTO {}
