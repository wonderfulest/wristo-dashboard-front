import type { PageQueryDTO } from './common'

export interface EmailSendRecord {
  id: number
  uuid: string
  templateId: number
  toEmail: string
  sendChannel: string
  variables: string
  status: number
  retryCount: number
  lastSendTime: string | null
  createdAt: string
  updatedAt: string
}

export interface EmailSendRecordPageParams extends PageQueryDTO {
  toEmail?: string
}

export interface EmailPreferencesVO {
  id: number
  email: string

  systemNotifications?: number
  purchaseReceipts?: number
  licenseUpdates?: number

  weeklyNewsletter?: number
  exclusivePromotions?: number
  bundleOffers?: number
  creatorSpotlight?: number
  personalizedRecommendations?: number

  designUpdates?: number
  platformAnnouncements?: number
  surveysFeedback?: number

  isUnsubscribed?: number
  lastUpdatedBy?: string

  createdAt?: string
  updatedAt?: string
  version?: number
}

export interface EmailPreferencesCreateDTO {
  email: string

  systemNotifications?: number
  purchaseReceipts?: number
  licenseUpdates?: number

  weeklyNewsletter?: number
  exclusivePromotions?: number
  bundleOffers?: number
  creatorSpotlight?: number
  personalizedRecommendations?: number

  designUpdates?: number
  platformAnnouncements?: number
  surveysFeedback?: number

  isUnsubscribed?: number
  lastUpdatedBy?: string
}

export interface EmailPreferencesUpdateDTO {
  id?: number
  email?: string

  systemNotifications?: number
  purchaseReceipts?: number
  licenseUpdates?: number

  weeklyNewsletter?: number
  exclusivePromotions?: number
  bundleOffers?: number
  creatorSpotlight?: number
  personalizedRecommendations?: number

  designUpdates?: number
  platformAnnouncements?: number
  surveysFeedback?: number

  isUnsubscribed?: number
  lastUpdatedBy?: string
}

export interface EmailPreferencesPageQueryDTO extends PageQueryDTO {
  email?: string
}
