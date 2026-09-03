import type { DailySalesItemVO } from '../../types/sales'

export function createSalesChartOption(
  items: DailySalesItemVO[],
  createEarningsGradient: () => unknown,
): any
