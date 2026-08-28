export const buildBottomLineChartLayout = () => ({
  legend: { bottom: 0 },
  grid: { bottom: 68 },
  yAxisMin: ({ min, max }) => min === 0 ? -Number(Math.max(max * 0.05, 0.05).toFixed(6)) : undefined,
})
