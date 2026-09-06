import type { EChartsCoreOption } from 'echarts/core'
import type { ActivationDaily } from '@/api/activationAnalytics'
export const activationSources: { key: keyof Omit<ActivationDaily, 'date'>; label: string; color: string }[]
export function activationPercent(count: number, total: number): number
export function activationSummary(items: ActivationDaily[]): Record<string, number>
export function createActivationChart(items: ActivationDaily[], trackingStartedAt: string | null, mode?: 'trend' | 'count' | 'percent'): EChartsCoreOption
