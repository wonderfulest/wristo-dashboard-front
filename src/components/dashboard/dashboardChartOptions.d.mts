interface AxisExtent {
  min: number
  max: number
}

export interface BottomLineChartLayout {
  legend: { bottom: number }
  grid: { bottom: number }
  yAxisMin: (extent: AxisExtent) => number | undefined
}

export function buildBottomLineChartLayout(): BottomLineChartLayout
