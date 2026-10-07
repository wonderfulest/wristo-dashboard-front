import type { EChartsCoreOption } from 'echarts/core'
import type { ActivationPlatformCount, ActivationPlatformDaily } from '@/api/activationAnalytics'
export const activationPlatforms: { value: string; label: string }[]
export function activationPlatformLabel(value?: string | null, miniProgram?: string | null): string
export function platformSummary(items?: ActivationPlatformCount[]): { value: string; label: string; activationCount: number; userCount: number }[]
export function platformTrend(dates: string[], items: ActivationPlatformDaily[], selected?: string): EChartsCoreOption
