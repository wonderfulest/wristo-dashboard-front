export type AnalyticsEvidenceStatus = 'READY' | 'EVIDENCE_INSUFFICIENT' | 'NO_SUCCESSFUL_MODEL'
export type ModelConfidence = 'INSUFFICIENT' | 'LOW' | 'MEDIUM' | 'HIGH'
export type ValueQuadrant = 'STAR' | 'SCALE' | 'NICHE' | 'LOW_VALUE'

export interface AnalyticsQuery {
  from?: string
  to?: string
  timezone?: 'UTC'
}

export interface AnalyticsResponse<T> {
  timezone: 'UTC'
  sampleSize: number
  modelVersion: string | null
  generatedAt: string
  partial: boolean
  status: AnalyticsEvidenceStatus
  data: T | null
}

export interface LaunchRecommendation {
  status: 'READY' | 'EVIDENCE_INSUFFICIENT'
  recommendedMinLaunches: number | null
  recommendedMaxLaunches: number | null
  predictedRevenueCents: number
  maximumPredictedRevenueCents: number
  confidenceLowerRevenueCents: number
  confidenceUpperRevenueCents: number
  marginalRevenuePerLaunchCents: number
  stockRevenueRetention: number
  launchRevenueRetention: number
  sampleSize: number
  reasons: string[]
}

export interface CategoryLaunchQuota {
  categoryId: number
  categoryName: string
  totalQuota: number
  firstLaunchQuota: number
  relaunchQuota: number
  marginalRevenueCents: number
}

export interface QuotaAllocation {
  requestedTotal: number
  allocatedTotal: number
  quotas: CategoryLaunchQuota[]
  reasons: string[]
}

export interface LaunchOperationsRecommendation {
  recommendation: LaunchRecommendation | null
  quotaAllocation: QuotaAllocation | null
}

export interface CohortContribution {
  cohortType: 'FIRST_LAUNCH' | 'RELAUNCH' | 'STOCK'
  downloads: number
  directRevenueCents: number
  bundleRevenueCents: number
  refundCents: number
  attributedRevenueCents: number
  appCount: number
}

export interface LifecycleAgePoint {
  ageDays: number
  sampleSize: number
  p25Downloads: number
  p50Downloads: number
  p75Downloads: number
  p50RevenueCents: number
}

export interface LifecycleCurve {
  status: 'READY' | 'SAMPLE_INSUFFICIENT'
  sampleSize: number
  peakAgeDays: number | null
  halfLifeAgeDays: number | null
  longTailAgeDays: number | null
  points: LifecycleAgePoint[]
}

export interface CategoryValue {
  categoryId: number
  categoryName: string
  ratingStatus: 'READY' | 'SAMPLE_INSUFFICIENT'
  quadrant: ValueQuadrant
  totalRevenueCents: number
  efficiencyRevenueCents: number
  productCount: number
  maturedProductCount: number
  blockbusterRate: number
  firstLaunchSuccessRate: number
  stabilityScore: number
}

export interface DesignerValue {
  designerUserId: number
  designerName: string
  ratingStatus: 'READY' | 'SAMPLE_INSUFFICIENT'
  quadrant: ValueQuadrant
  totalRevenueCents: number
  efficiencyRevenueCents: number
  productCount: number
  maturedProductCount: number
  blockbusterRate: number
  firstLaunchSuccessRate: number
  stabilityScore: number
}
