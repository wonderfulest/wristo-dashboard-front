<template>
  <div class="dashboard-content">
    <div class="section-heading">
      <div>
        <h3 class="section-title">设备型号</h3>
      </div>
      <div class="summary-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :clearable="true"
          :disabled-date="disableFutureDate"
          @change="handleDateChange"
        />
        <div class="total-orders">总订单：{{ totalOrders.toLocaleString() }}</div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <p>获取设备型号订单统计失败：{{ error }}</p>
    </div>

    <div class="summary-grid" v-loading="loading">
      <el-card shadow="never" :body-style="{ padding: '12px' }">
        <div ref="chartRef" class="pie-chart"></div>
      </el-card>

      <div class="table-panel">
        <el-table :data="items" border style="width: 100%" empty-text="No data">
          <el-table-column prop="device" label="设备型号" min-width="220" show-overflow-tooltip />
          <el-table-column prop="orderCount" label="订单数" width="120" align="right">
            <template #default="{ row }">
              {{ row.orderCount.toLocaleString() }}
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
        <el-pagination
          class="summary-pagination"
          background
          layout="prev, pager, next, sizes, total"
          :current-page="pageNum"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="totalDevices"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getDeviceOrderSummary } from '@/api/purchase'
import type { DeviceOrderStatsVO } from '@/types/api'

const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<DeviceOrderStatsVO[]>([])
const totalOrders = ref(0)
const totalDevices = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const chartRef = ref<HTMLElement | null>(null)
let echartsMod: any = null
let chart: any = null

const formatPercent = (value: number): string => {
  return `${(Number(value) || 0).toFixed(2)}%`
}

const toDate = (value: string): Date => new Date(`${value}T00:00:00`)

const formatDate = (date: Date): string => {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getDefaultDateRange = (): [string, string] => {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setMonth(startDate.getMonth() - 1)
  return [formatDate(startDate), formatDate(endDate)]
}

const dateRange = ref<[string, string] | []>(getDefaultDateRange())

const disableFutureDate = (date: Date): boolean => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return date.getTime() > today.getTime()
}

const normalizeDateRange = () => {
  if (!dateRange.value || dateRange.value.length !== 2) return
  const [start, end] = dateRange.value
  const startDate = toDate(start)
  const endDate = toDate(end)
  const maxStart = new Date(endDate)
  maxStart.setFullYear(maxStart.getFullYear() - 1)
  if (startDate < maxStart) {
    dateRange.value = [formatDate(maxStart), end]
    ElMessage.warning('设备订单统计最多支持选择一年的时间范围')
  }
}

const fetchSummary = async () => {
  try {
    loading.value = true
    error.value = null
    normalizeDateRange()
    const [startDate, endDate] = dateRange.value.length === 2 ? dateRange.value : [undefined, undefined]
    const res = await getDeviceOrderSummary({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      startDate,
      endDate
    })
    if (res.code === 0 && res.data) {
      items.value = res.data.list || []
      totalDevices.value = Number(res.data.total) || 0
      totalOrders.value = Number(res.data.meta?.totalOrders) || 0
    } else {
      error.value = res.msg || 'Failed to fetch device order summary'
    }
  } catch (e) {
    error.value = 'Network error occurred'
    console.error('Error fetching device order summary:', e)
  } finally {
    loading.value = false
  }
}

const handleDateChange = async () => {
  pageNum.value = 1
  await fetchSummary()
}

const handlePageChange = async (value: number) => {
  pageNum.value = value
  await fetchSummary()
}

const handleSizeChange = async (value: number) => {
  pageSize.value = value
  pageNum.value = 1
  await fetchSummary()
}

const initChart = async () => {
  if (!chartRef.value) return
  if (!echartsMod) {
    echartsMod = await import('echarts/core')
    const { PieChart } = await import('echarts/charts')
    const { TooltipComponent, LegendComponent } = await import('echarts/components')
    const { CanvasRenderer } = await import('echarts/renderers')
    echartsMod.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])
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
  const pieData = items.value.map(item => ({
    name: item.device || 'Unknown',
    value: Number(item.orderCount) || 0,
    percentage: Number(item.percentage) || 0
  }))

  chart.setOption({
    color: ['#1e88e5', '#2f9e6e', '#f59f00', '#845ef7', '#e03131', '#0ca678', '#5c7cfa', '#f76707'],
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data || {}
        return `${params.name}<br/>订单数：${Number(params.value).toLocaleString()}<br/>占比：${formatPercent(data.percentage)}`
      }
    },
    legend: {
      show: false
    },
    series: [
      {
        name: '设备型号',
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
          width: 118,
          overflow: 'truncate'
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          maxSurfaceAngle: 80
        },
        data: pieData
      }
    ]
  }, true)
}

onMounted(async () => {
  await fetchSummary()
  await nextTick()
  await initChart()
})

watch(items, () => updateChart())

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
.section-subtitle { font-size: 13px; color: #6c757d; margin-top: 4px; }
.summary-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
.total-orders { font-size: 13px; font-weight: 600; color: #495057; white-space: nowrap; }
.summary-grid { display: grid; grid-template-columns: minmax(420px, 1fr) minmax(420px, 1fr); gap: 16px; align-items: stretch; }
.pie-chart { width: 100%; height: 360px; }
.table-panel { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.summary-pagination { justify-content: flex-end; }
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
  .pie-chart { height: 300px; min-height: 300px; }
  .table-panel { overflow-x: auto; }
}
</style>
