<template>
  <section class="overview-section" v-loading="loading">
    <div class="section-heading">
      <div><span class="section-kicker">PERFORMANCE</span><h2>经营概览</h2></div>
      <DashboardSectionFilter v-model="filter" :loading="loading" />
    </div>
    <span class="period">统计周期：{{ filter.startDate }} 至 {{ filter.endDate }}</span>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <div class="metric-grid">
      <article v-for="item in cards" :key="item.key" class="metric-card" :class="`metric-card--${item.tone}`">
        <span class="metric-label">{{ item.label }}</span>
        <strong>{{ formatDashboardMetric(item.key, metrics[item.key]) }}</strong>
        <span class="metric-note">{{ item.note }}</span>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getFunnel, getSales } from '@/api/purchase'
import DashboardSectionFilter from './DashboardSectionFilter.vue'
import { buildDashboardRange, calculateBusinessMetrics, formatDashboardMetric } from './dashboardOverview.mjs'
import type { DashboardMetrics } from './dashboardOverview.mjs'
import type { DashboardFilter } from './dashboardTypes'

const emit = defineEmits<{ (event: 'metrics-change', value: DashboardMetrics): void }>()
const initialRange = buildDashboardRange('7d')
const filter = ref<DashboardFilter>({ rangeType: '7d', startDate: initialRange.startDate, endDate: initialRange.endDate, appId: null })
const loading = ref(false)
const error = ref('')
const metrics = ref<DashboardMetrics>(calculateBusinessMetrics())
const cards = [
  { key: 'revenue' as const, label: '销售收入', note: '统计周期内已记录收入', tone: 'green' },
  { key: 'orders' as const, label: '订单数', note: '仅统计产生销售收入的订单', tone: 'blue' },
  { key: 'downloads' as const, label: '首次下载', note: '统计期内首次出现的设备与表盘', tone: 'amber' },
  { key: 'repeatDownloads' as const, label: '历史重新上报', note: '单独统计，不计入首次下载转化率', tone: 'blue' },
  { key: 'purchaseRate' as const, label: '首次下载 → 购买', note: '同批设备截至当前的去重购买占比', tone: 'coral' },
]

const query = computed(() => ({
  startDate: filter.value.startDate,
  endDate: filter.value.endDate,
  ...(filter.value.appId ? { appId: filter.value.appId } : {}),
}))

let metricsRequest = 0
const fetchMetrics = async () => {
  const request = ++metricsRequest
  metrics.value = calculateBusinessMetrics()
  emit('metrics-change', metrics.value)
  loading.value = true
  error.value = ''
  try {
    const [sales, funnel] = await Promise.all([getSales(query.value), getFunnel(query.value)])
    if (request !== metricsRequest) return
    if (sales.code !== 0 || funnel.code !== 0) throw new Error('统计加载失败')
    if (funnel.data?.firstDownloads == null || funnel.data?.purchasedDevices == null) throw new Error('首次下载统计尚未就绪')
    metrics.value = calculateBusinessMetrics(sales.data || [], funnel.data || null)
    emit('metrics-change', metrics.value)
  } catch {
    if (request !== metricsRequest) return
    error.value = '经营指标暂时无法加载，请稍后重试'
  } finally {
    if (request === metricsRequest) loading.value = false
  }
}

watch(filter, fetchMetrics, { deep: true, immediate: true })
</script>

<style scoped>
.overview-section { margin-top: 18px; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 6px; }
.section-kicker { color: #809088; font-size: 10px; font-weight: 800; letter-spacing: .14em; }
h2 { margin: 2px 0 0; color: #1d3027; font-size: 18px; }
.period { color: #819087; font-size: 12px; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 10px; }
.metric-card { position: relative; overflow: hidden; display: flex; min-height: 116px; padding: 18px; flex-direction: column; border: 1px solid #e3eae6; border-radius: 14px; background: #fff; box-sizing: border-box; }
.metric-card::after { content: ''; position: absolute; top: 0; right: 0; width: 72px; height: 4px; background: var(--accent); }
.metric-card--green { --accent: #15915f; } .metric-card--blue { --accent: #3278c8; } .metric-card--amber { --accent: #d79221; } .metric-card--coral { --accent: #d35f50; }
.metric-label { color: #65756d; font-size: 13px; }
strong { margin: 8px 0 5px; color: #172c22; font-size: 27px; line-height: 1; font-variant-numeric: tabular-nums; }
.metric-note { color: #98a39d; font-size: 11px; }
@media (max-width: 900px) { .metric-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px) { .metric-grid { grid-template-columns: 1fr; } .section-heading { align-items: flex-start; flex-direction: column; gap: 5px; } }
</style>
