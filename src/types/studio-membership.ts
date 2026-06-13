import type { PageQueryDTO } from './common'

export type StudioMembershipLevel =
  | 'free'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'premium_30d'

export interface StudioMembershipSummaryItem {
  level: StudioMembershipLevel
  roleCode: string
  maxDesigns?: number | null
  memberCount: number
  designCount: number
  avgDesignCount: number
}

export interface StudioMembershipMember {
  userId: number
  username?: string
  email?: string
  level: StudioMembershipLevel
  roleCode: string
  source: 'role' | 'subscription' | 'default_free'
  maxDesigns?: number | null
  designCount: number
  canCreateDesign: boolean
  subscriptionStartTime?: string | null
  subscriptionEndTime?: string | null
  scheduledChangeAction?: string | null
  scheduledChangeEffectiveAt?: string | null
  cancelScheduled?: boolean | null
  createdAt?: string | null
  lastLoginTime?: string | null
}

export interface StudioMembershipPageQuery extends PageQueryDTO {
  userId?: number
  email?: string
  level?: StudioMembershipLevel
}
