<template>
  <div class="dashboard-content">
    <div class="section-heading">
      <h3 class="section-title">国家订单分布</h3>
      <div class="summary-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :clearable="false"
          :disabled-date="disableFutureDate"
          @change="handleDateChange"
        />
        <el-select v-model="topN" class="top-n-select" @change="handleTopNChange">
          <el-option v-for="value in topNOptions" :key="value" :label="`Top ${value}`" :value="value" />
        </el-select>
        <div class="total-orders">总订单：{{ distribution.totalOrders.toLocaleString() }}</div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <p>获取国家订单分布失败：{{ error }}</p>
    </div>

    <div class="summary-grid" v-loading="loading">
      <el-card shadow="never" :body-style="{ padding: '12px' }">
        <div class="chart-shell">
          <div ref="chartRef" class="pie-chart"></div>
          <div v-if="!loading && distribution.totalOrders === 0" class="empty-chart">暂无数据</div>
        </div>
      </el-card>

      <div class="table-panel">
        <el-table :data="distribution.items" border style="width: 100%" empty-text="No data">
          <el-table-column label="国家" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatCountryLabel(row.countryCode, regionNames) }}
            </template>
          </el-table-column>
          <el-table-column prop="orderCount" label="订单数" width="120" align="right">
            <template #default="{ row }">
              {{ Number(row.orderCount).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column label="占比" width="180" align="right">
            <template #default="{ row }">
              <div class="percent-cell">
                <el-progress
                  :percentage="Number(row.percentage) || 0"
                  :stroke-width="8"
                  :show-text="false"
                />
                <span>{{ formatPercent(row.percentage) }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getCountryOrderDistribution } from '@/api/purchase'
import type {
  CountryOrderDistributionVO,
  CountryOrderTopN,
} from '@/types/api'
import {
  buildDefaultCountryOrderRange,
  clampCountryOrderRange,
  formatCountryLabel,
} from './countryOrderDistributionUtils.mjs'

const topNOptions: CountryOrderTopN[] = [5, 10, 20]
const topN = ref<CountryOrderTopN>(10)
const dateRange = ref<[string, string]>(buildDefaultCountryOrderRange())
const loading = ref(false)
const error = ref<string | null>(null)
const distribution = ref<CountryOrderDistributionVO>({
  startDate: dateRange.value[0],
  endDate: dateRange.value[1],
  topN: 10,
  totalOrders: 0,
  otherOrderCount: 0,
  items: [],
})
const chartRef = ref<HTMLElement | null>(null)
const regionNames = typeof Intl.DisplayNames === 'function'
  ? new Intl.DisplayNames(['zh-CN'], { type: 'region' })
  : null

let echartsMod: any = null
let chart: any = null

const formatPercent = (value: number): string => {
  return `${(Number(value) || 0).toFixed(2)}%`
}

const disableFutureDate = (date: Date): boolean => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date.getTime() > today.getTime()
}

const normalizeDateRange = () => {
  const normalized = clampCountryOrderRange(dateRange.value)
  dateRange.value = normalized.range
  if (normalized.clamped) {
    ElMessage.warning('国家订单统计最多支持选择一个月的时间范围')
  }
}

const fetchDistribution = async () => {
  try {
    loading.value = true
    error.value = null
    normalizeDateRange()
    const res = await getCountryOrderDistribution({
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
      topN: topN.value,
    })
    if (res.code === 0 && res.data) {
      distribution.value = {
        ...res.data,
        totalOrders: Number(res.data.totalOrders) || 0,
        otherOrderCount: Number(res.data.otherOrderCount) || 0,
        items: res.data.items || [],
      }
    } else {
      error.value = res.msg || 'Failed to fetch country order distribution'
    }
  } catch (e) {
    error.value = 'Network error occurred'
    console.error('Error fetching country order distribution:', e)
  } finally {
    loading.value = false
  }
}

const handleDateChange = async () => {
  await fetchDistribution()
}

const handleTopNChange = async () => {
  await fetchDistribution()
}

const initChart = async () => {
  if (!chartRef.value) return
  if (!echartsMod) {
    echartsMod = await import('echarts/core')
    const { PieChart } = await import('echarts/charts')
    const { TooltipComponent } = await import('echarts/components')
    const { CanvasRenderer } = await import('echarts/renderers')
    echartsMod.use([PieChart, TooltipComponent, CanvasRenderer])
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
  const chartData = distribution.value.items.map(item => ({
    name: formatCountryLabel(item.countryCode, regionNames),
    value: Number(item.orderCount) || 0,
    percentage: Number(item.percentage) || 0,
  }))
  const otherOrderCount = Number(distribution.value.otherOrderCount) || 0
  if (otherOrderCount > 0) {
    const percentage = distribution.value.totalOrders > 0
      ? otherOrderCount * 100 / distribution.value.totalOrders
      : 0
    chartData.push({
      name: '其他',
      value: otherOrderCount,
      percentage,
    })
  }

  chart.setOption({
    color: ['#1e88e5', '#2f9e6e', '#f59f00', '#845ef7', '#e03131', '#0ca678', '#5c7cfa', '#f76707'],
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data || {}
        return `${params.name}<br/>订单数：${Number(params.value).toLocaleString()}<br/>占比：${formatPercent(data.percentage)}`
      },
    },
    series: [
      {
        name: '国家订单分布',
        type: 'pie',
        radius: ['36%', '62%'],
        center: ['50%', '54%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}',
          color: '#343a40',
          fontSize: 11,
          width: 132,
          overflow: 'truncate',
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          maxSurfaceAngle: 80,
        },
        data: chartData,
      },
    ],
  }, true)
}

onMounted(async () => {
  await fetchDistribution()
  await nextTick()
  await initChart()
})

watch(distribution, updateChart, { deep: true })

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
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin: 16px 0; }
.section-title { font-size: 18px; font-weight: 700; color: #212529; margin: 0; text-align: left; }
.summary-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
.top-n-select { width: 108px; }
.total-orders { font-size: 13px; font-weight: 600; color: #495057; white-space: nowrap; }
.summary-grid { display: grid; grid-template-columns: minmax(420px, 1fr) minmax(420px, 1fr); gap: 16px; align-items: stretch; }
.chart-shell { position: relative; }
.pie-chart { width: 100%; height: 360px; }
.empty-chart { position: absolute; inset: 0; display: grid; place-items: center; color: #909399; font-size: 14px; pointer-events: none; }
.table-panel { min-width: 0; }
.percent-cell { display: grid; grid-template-columns: minmax(80px, 1fr) 64px; gap: 10px; align-items: center; }
.error-message { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 24px 0; color: #721c24; }

@media (max-width: 1100px) {
  .summary-grid { grid-template-columns: 1fr; }
  .section-heading { align-items: flex-start; flex-direction: column; }
  .summary-actions { justify-content: flex-start; }
}

@media (max-width: 768px) {
  .dashboard-content { margin-top: 18px; }
  .summary-actions { width: 100%; align-items: stretch; flex-direction: column; }
  .top-n-select { width: 100%; }
  .pie-chart { height: 300px; min-height: 300px; }
  .table-panel { overflow-x: auto; }
}
</style>
