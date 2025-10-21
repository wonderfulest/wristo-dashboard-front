import type { PageQueryDTO } from './common'

export interface PromotionCampaignVO {
  id: number
  name: string
  startTime?: string
  endTime?: string
  description?: string
  creator?: string
  segmentId?: number
  emailTemplateId?: number
  status?: number // 0草稿 1进行中 2结束
  isActive?: number
  createdAt?: string
  updatedAt?: string
  version?: number
}

export interface PromotionCampaignCreateDTO {
  name: string
  startTime?: string
  endTime?: string
  description?: string
  creator?: string
  segmentId?: number
  emailTemplateId?: number
  status?: number
}

export interface PromotionCampaignUpdateDTO {
  name?: string
  startTime?: string
  endTime?: string
  description?: string
  creator?: string
  segmentId?: number
  emailTemplateId?: number
  status?: number
  isActive?: number
  isDeleted?: number
  version?: number
}

export interface PromotionCampaignPageQuery extends PageQueryDTO {
  name?: string
  status?: number
  isActive?: number
}

export interface PromotionItemVO {
  id: number
  campaignId: number
  productId: number
  rank?: number
  title?: string
  imageUrl?: string
  clickUrl?: string
  isActive?: number
  createdAt?: string
  updatedAt?: string
  version?: number
  product?: any
}

export interface PromotionItemDTO {
  productId: number
  rank?: number
  title?: string
  imageUrl?: string
  clickUrl?: string
  isActive?: number
}
