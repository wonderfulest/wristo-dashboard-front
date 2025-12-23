import type { PageQueryDTO } from './common'

export type MarketingCampaignStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'SCHEDULED' | 'CANCELLED'

export interface CampaignVO {
  id: number
  name: string
  startTime?: string
  endTime?: string
  description?: string
  creator?: string
  segmentId?: number
  emailTemplateId?: number
  variables?: string
  status?: MarketingCampaignStatus
  isActive?: number
  createdAt?: string
  updatedAt?: string
  version?: number
}

export interface CampaignCreateDTO {
  name: string
  startTime?: string
  endTime?: string
  description?: string
  creator?: string
  segmentId?: number
  emailTemplateId?: number
  variables?: string
  status?: MarketingCampaignStatus
}

export interface CampaignUpdateDTO {
  name?: string
  startTime?: string
  endTime?: string
  description?: string
  creator?: string
  segmentId?: number
  emailTemplateId?: number
  variables?: string
  status?: MarketingCampaignStatus
  isActive?: number
  isDeleted?: number
  version?: number
}

export interface CampaignPageQuery extends PageQueryDTO {
  name?: string
  status?: MarketingCampaignStatus
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
