import test from 'node:test'
import assert from 'node:assert/strict'
import { createSalesChartOption } from '../src/components/dashboard/salesChart.mjs'

test('sales chart plots daily first-launch design counts on the count axis', () => {
  const option = createSalesChartOption([
    { date: '2026-08-12', orderCount: 4, downloads: 80, earnings: 1299, launchCount: 3 },
    { date: '2026-08-13', orderCount: 2, downloads: 40, earnings: 500 },
  ], () => 'earnings-gradient')

  assert.deepEqual(option.legend.data, ['订单数', '下载量 ÷20', '上线数量', '当日收益'])
  const launchSeries = option.series.find(series => series.name === '上线数量')
  assert.deepEqual(launchSeries.data, [3, 0])
  assert.equal(launchSeries.yAxisIndex, 0)
  assert.equal(launchSeries.lineStyle.color, '#8b5cf6')
  assert.equal(option.yAxis[0].max, 14)
})

test('sales chart tooltip displays the unscaled daily launch count', () => {
  const option = createSalesChartOption([
    { date: '2026-08-12', orderCount: 4, downloads: 80, earnings: 1299, launchCount: 3 },
  ], () => 'earnings-gradient')

  const tooltip = option.tooltip.formatter([
    { axisValue: '2026-08-12', dataIndex: 0, seriesName: '订单数', data: 4 },
    { axisValue: '2026-08-12', dataIndex: 0, seriesName: '下载量 ÷20', data: 4 },
    { axisValue: '2026-08-12', dataIndex: 0, seriesName: '上线数量', data: 3 },
    { axisValue: '2026-08-12', dataIndex: 0, seriesName: '当日收益', data: 12.99 },
  ])

  assert.match(tooltip, /上线数量：3/)
  assert.match(tooltip, /下载量：80（÷20=4）/)
  assert.match(tooltip, /当日收益：\$12\.99/)
})
