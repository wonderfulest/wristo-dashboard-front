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
  variables?: string
  status?: string // 0草稿 1进行中 2结束
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
  variables?: string
  status?: string
}

export interface PromotionCampaignUpdateDTO {
  name?: string
  startTime?: string
  endTime?: string
  description?: string
  creator?: string
  segmentId?: number
  emailTemplateId?: number
  variables?: string
  status?: string
  isActive?: number
  isDeleted?: number
  version?: number
}

export interface PromotionCampaignPageQuery extends PageQueryDTO {
  name?: string
  status?: string
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

export type CampaignPushChannel = 'SES' | 'ZOHO'

export type CampaignPushStatus = 'DRAFT' | 'SENDING' | 'SUCCESS' | 'FAILED'

export interface CampaignPushVO {
  id: number
  campaignId: number
  userId: number
  channel?: CampaignPushChannel
  templateId?: number
  email?: string
  variables?: string
  status?: CampaignPushStatus
  startedAt?: string
  finishedAt?: string
  createdBy?: number
  isDeleted?: number
  version?: number
  createdAt?: string
  updatedAt?: string
}

export interface CampaignPushCreateDTO {
  campaignId: number
  userId: number
  channel?: CampaignPushChannel
  templateId?: number
  email?: string
  variables?: string
  status?: CampaignPushStatus
  createdBy?: number
}

export interface CampaignPushUpdateDTO {
  campaignId?: number
  userId?: number
  channel?: CampaignPushChannel
  templateId?: number
  email?: string
  variables?: string
  status?: CampaignPushStatus
  createdBy?: number
  isDeleted?: number
  version?: number
}

export interface CampaignPushPageQuery extends PageQueryDTO {
  campaignId?: number
  userId?: number
  channel?: CampaignPushChannel
  status?: CampaignPushStatus
}
