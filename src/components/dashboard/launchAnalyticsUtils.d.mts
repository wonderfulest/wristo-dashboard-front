import type {
  AnalyticsResponse,
  CohortContribution,
  LaunchRecommendation,
  ValueQuadrant,
} from '../../types/launch-analytics'

export function attributedRevenueCents(cohort: Partial<CohortContribution> | null | undefined): number
export function contributionsAreConserved(contributions: Record<string, CohortContribution> | null | undefined): boolean
export function formatUsdCents(value: number | null | undefined): string
export function recommendationRangeLabel(recommendation: Partial<LaunchRecommendation> | null | undefined): string
export function modelStatusLabel(response: Pick<AnalyticsResponse<unknown>, 'partial' | 'status'>): string
export function quadrantLabel(quadrant: ValueQuadrant | string | null | undefined): string
