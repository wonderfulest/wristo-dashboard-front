<template>
  <div class="dashboard-content">
    <h3 class="section-title">销售趋势</h3>

    <div v-if="error" class="error-message">
      <p>获取销售折线图失败：{{ error }}</p>
    </div>

    <div class="filters">
      <el-radio-group v-model="rangeType" size="small" @change="handleRangeTypeChange">
        <el-radio-button label="7d">近一周</el-radio-button>
        <el-radio-button label="15d">近半月</el-radio-button>
        <el-radio-button label="30d">近一月</el-radio-button>
        <el-radio-button label="60d">近两月</el-radio-button>
        <el-radio-button label="custom">自定义</el-radio-button>
      </el-radio-group>

      <el-date-picker
        v-if="rangeType === 'custom'"
        v-model="dateRange"
        type="daterange"
        range-separator="-"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        size="small"
        :disabled="loading"
      />

      <el-input
        v-model.number="appId"
        placeholder="应用ID(可选)"
        clearable
        size="small"
        style="width: 180px"
        :disabled="loading"
      />

      <el-button type="primary" size="small" :loading="loading" @click="handleQuery">查询</el-button>
    </div>

    <el-card shadow="never" :body-style="{ padding: '12px 12px 4px 12px' }" v-loading="loading">
      <div ref="chartRef" class="line-chart"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { getSales } from '@/api/purchase'
import type { DailySalesItemVO, SalesQueryDTO } from '@/types/api'

const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<DailySalesItemVO[]>([])

// date range and quick ranges
type Range = [Date, Date]
const today = () => new Date()
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d }
const rangeType = ref<'7d'|'15d'|'30d'|'60d'|'custom'>('60d')
const getRangeByType = (): Range => {
  const end = today()
  switch (rangeType.value) {
    case '7d': return [daysAgo(6), end]
    case '15d': return [daysAgo(14), end]
    case '30d': return [daysAgo(29), end]
    case '60d': return [daysAgo(59), end]
    default: return [daysAgo(29), end]
  }
}
const dateRange = ref<Range>(getRangeByType())
const appId = ref<number | null>(null)

const handleRangeTypeChange = async () => {
  if (rangeType.value !== 'custom') {
    dateRange.value = getRangeByType()
  }
  await handleQuery()
}

const handleQuery = async () => {
  await fetchSales(buildDto())
}

const fmt = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const buildDto = (): SalesQueryDTO => {
  const [s, e] = (rangeType.value === 'custom') ? dateRange.value : getRangeByType()
  const dto: SalesQueryDTO = {
    startDate: fmt(s),
    endDate: fmt(e)
  }
  if (appId.value !== null && Number.isFinite(appId.value) && (appId.value as number) > 0) {
    dto.appId = appId.value
  }
  return dto
}

const chartRef = ref<HTMLElement | null>(null)
let echartsMod: any = null
let chart: any = null

const fetchSales = async (dto?: SalesQueryDTO) => {
  try {
    loading.value = true
    error.value = null
    const res = await getSales(dto)
    if (res.code === 0 && Array.isArray(res.data)) {
      items.value = res.data
    } else {
      error.value = res.msg || 'Failed to fetch sales data'
    }
  } catch (e) {
    error.value = 'Network error occurred'
    console.error('Error fetching sales:', e)
  } finally {
    loading.value = false
  }
}

const initChart = async () => {
  if (!chartRef.value) return
  if (!echartsMod) {
    echartsMod = await import('echarts/core')
    const { LineChart } = await import('echarts/charts')
    const { TooltipComponent, GridComponent, LegendComponent } = await import('echarts/components')
    const { CanvasRenderer } = await import('echarts/renderers')
    echartsMod.use([LineChart, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer])
  }
  chart = echartsMod.init(chartRef.value)
  updateChart()
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  if (chart) chart.resize()
}

const updateChart = () => {
  if (!chart) return
  const dates = items.value.map(i => i.date)
  const orderCounts = items.value.map(i => i.orderCount)
  const downloads = items.value.map(i => Number(i.downloads) || 0)
  const scaledDownloads = downloads.map(v => v / 20)
  // backend returns earnings in cents; convert to dollars for display
  const earnings = items.value.map(i => (Number(i.earnings) || 0) / 100)

  const axisValues = [...orderCounts, ...scaledDownloads, ...earnings]
  const finiteAxisValues = axisValues.filter(v => Number.isFinite(v)) as number[]
  const maxVal = finiteAxisValues.length ? Math.max(...finiteAxisValues) : 0
  const yMax = Math.max(1, Math.ceil(maxVal * 1.05))

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any[]) => {
        const d = params?.[0]?.axisValue || ''
        const oc = params.find(p => p.seriesName === '订单数')?.data ?? '-'
        const index = params?.[0]?.dataIndex ?? -1
        const dl = index >= 0 ? downloads[index] : '-'
        const scaledDl = params.find(p => p.seriesName === '下载量 ÷20')?.data ?? '-'
        const er = params.find(p => p.seriesName === '当日收益')?.data ?? '-'
        return `${d}<br/>订单数：${oc}<br/>下载量：${dl}（÷20=${Number(scaledDl).toLocaleString('en-US', { maximumFractionDigits: 2 })}）<br/>当日收益：$${Number(er).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }
    },
    legend: {
      bottom: 2,
      left: 'center',
      selectedMode: true,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: '#6c757d', fontSize: 12 },
      data: ['订单数', '下载量 ÷20', '当日收益']
    },
    grid: { left: 48, right: 60, top: 24, bottom: 52 },
    xAxis: { type: 'category', data: dates, boundaryGap: false, axisLabel: { color: '#6c757d' } },
    yAxis: [
      {
        type: 'value',
        name: '订单数',
        position: 'left',
        min: 0,
        max: yMax,
        axisLabel: { color: '#6c757d' },
        splitLine: { lineStyle: { color: '#edf2f7' } }
      },
      {
        type: 'value',
        name: '美元',
        position: 'right',
        min: 0,
        max: yMax,
        axisLabel: {
          color: '#6c757d',
          formatter: (val: number) => `$${Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { color: '#1e88e5', width: 2 },
        // no area gradient for orders
        areaStyle: undefined as any,
        data: orderCounts
      },
      {
        name: '下载量 ÷20',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { color: '#f59f00', width: 2 },
        areaStyle: undefined as any,
        data: scaledDownloads
      },
      {
        name: '当日收益',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        showSymbol: false,
        lineStyle: { color: '#2f9e6e', width: 2 },
        areaStyle: {
          color: new echartsMod.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(47, 158, 110, 0.25)' },
            { offset: 1, color: 'rgba(47, 158, 110, 0.0)' }
          ])
        },
        data: earnings
      }
    ]
  }
  chart.setOption(option, true)
}

onMounted(async () => {
  await fetchSales(buildDto())
  await nextTick()
  await initChart()
})

watch(items, () => updateChart())
// only fetch when clicking the query button

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
.dashboard-content { margin-top: 32px; }
.section-title { font-size: 18px; font-weight: 700; color: #212529; margin: 16px 0; text-align: left; }
.error-message { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 24px 0; color: #721c24; }
.filters { margin: 8px 0 12px 0; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.app-id-input { width: 180px; }
.line-chart { width: 100%; height: 320px; }

@media (max-width: 768px) {
  .dashboard-content { margin-top: 18px; }
  .line-chart { height: 300px; min-height: 300px; }
}
</style>
