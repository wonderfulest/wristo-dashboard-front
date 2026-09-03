const numericValue = value => Number(value) || 0

export function createSalesChartOption(items, createEarningsGradient) {
  const dates = items.map(item => item.date)
  const orderCounts = items.map(item => numericValue(item.orderCount))
  const downloads = items.map(item => numericValue(item.downloads))
  const scaledDownloads = downloads.map(value => value / 20)
  const launchCounts = items.map(item => numericValue(item.launchCount))
  const earnings = items.map(item => numericValue(item.earnings) / 100)
  const axisValues = [...orderCounts, ...scaledDownloads, ...launchCounts, ...earnings]
  const finiteAxisValues = axisValues.filter(value => Number.isFinite(value))
  const maxValue = finiteAxisValues.length ? Math.max(...finiteAxisValues) : 0
  const yMax = Math.max(1, Math.ceil(maxValue * 1.05))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: params => {
        const date = params?.[0]?.axisValue || ''
        const orderCount = params.find(param => param.seriesName === '订单数')?.data ?? '-'
        const index = params?.[0]?.dataIndex ?? -1
        const downloadCount = index >= 0 ? downloads[index] : '-'
        const scaledDownloadCount = params.find(param => param.seriesName === '下载量 ÷20')?.data ?? '-'
        const launchCount = params.find(param => param.seriesName === '上线数量')?.data ?? '-'
        const earningsAmount = params.find(param => param.seriesName === '当日收益')?.data ?? '-'
        return `${date}<br/>订单数：${orderCount}<br/>下载量：${downloadCount}（÷20=${Number(scaledDownloadCount).toLocaleString('en-US', { maximumFractionDigits: 2 })}）<br/>上线数量：${Number(launchCount).toLocaleString('en-US')}<br/>当日收益：$${Number(earningsAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
    },
    legend: {
      bottom: 2,
      left: 'center',
      selectedMode: true,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: '#6c757d', fontSize: 12 },
      data: ['订单数', '下载量 ÷20', '上线数量', '当日收益'],
    },
    grid: { left: 48, right: 60, top: 24, bottom: 52 },
    xAxis: { type: 'category', data: dates, boundaryGap: false, axisLabel: { color: '#6c757d' } },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        position: 'left',
        min: 0,
        max: yMax,
        axisLabel: { color: '#6c757d' },
        splitLine: { lineStyle: { color: '#edf2f7' } },
      },
      {
        type: 'value',
        name: '美元',
        position: 'right',
        min: 0,
        max: yMax,
        axisLabel: {
          color: '#6c757d',
          formatter: value => `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { color: '#1e88e5', width: 2 },
        data: orderCounts,
      },
      {
        name: '下载量 ÷20',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { color: '#f59f00', width: 2 },
        data: scaledDownloads,
      },
      {
        name: '上线数量',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { color: '#8b5cf6', width: 2 },
        data: launchCounts,
      },
      {
        name: '当日收益',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        showSymbol: false,
        lineStyle: { color: '#2f9e6e', width: 2 },
        areaStyle: { color: createEarningsGradient() },
        data: earnings,
      },
    ],
  }
}
