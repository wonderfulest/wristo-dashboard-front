<template>
  <section class="output-section" v-loading="loading">
    <div class="section-heading">
      <div><span class="section-kicker">DESIGN OUTPUT</span><h2>设计产出</h2></div>
      <DashboardSectionFilter v-model="filter" :loading="loading" :show-app="false" />
    </div>
    <span class="period">统计周期：{{ filter.startDate }} 至 {{ filter.endDate }}（北京时间）</span>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-alert
      v-else-if="stats.estimatedHistory"
      class="history-alert"
      title="该时段包含历史估算数据：提交审核和审核通过时间由原状态及最后更新时间回填。"
      type="warning"
      :closable="false"
      show-icon
    />
    <div class="metric-grid">
      <article v-for="item in cards" :key="item.key" class="metric-card" :class="`metric-card--${item.tone}`">
        <span class="metric-label">{{ item.label }}</span>
        <strong>{{ Number(stats[item.key] || 0).toLocaleString('zh-CN') }}</strong>
        <span class="metric-note">{{ item.note }}</span>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getDesignOutputStats, type DesignOutputStats } from '@/api/design-output-analytics'
import DashboardSectionFilter from './DashboardSectionFilter.vue'
import { buildDashboardRange } from './dashboardOverview.mjs'
import type { DashboardFilter } from './dashboardTypes'

const initialRange = buildDashboardRange('7d')
const filter = ref<DashboardFilter>({ rangeType: '7d', startDate: initialRange.startDate, endDate: initialRange.endDate, appId: null })
const loading = ref(false)
const error = ref('')
const stats = ref<DesignOutputStats>({
  startDate: initialRange.startDate,
  endDate: initialRange.endDate,
  createdDesigns: 0,
  submittedDesigns: 0,
  approvedDesigns: 0,
  launchedDesigns: 0,
  estimatedHistory: false,
})
const cards = [
  { key: 'createdDesigns' as const, label: '新增设计数量', note: '首次创建的去重设计数', tone: 'green' },
  { key: 'submittedDesigns' as const, label: '提交审核数量', note: '首次提交审核的去重设计数', tone: 'blue' },
  { key: 'approvedDesigns' as const, label: '审核通过数量', note: '首次审核通过的去重设计数', tone: 'amber' },
  { key: 'launchedDesigns' as const, label: '上线数量', note: '首次上线的去重设计数', tone: 'coral' },
]

const fetchStats = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await getDesignOutputStats({ startDate: filter.value.startDate, endDate: filter.value.endDate })
    if (!response.data) throw new Error('missing design output statistics')
    stats.value = response.data
  } catch {
    error.value = '设计产出指标暂时无法加载，请稍后重试'
  } finally {
    loading.value = false
  }
}

watch(filter, fetchStats, { deep: true, immediate: true })
</script>

<style scoped>
.output-section { margin-top: 18px; }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 6px; }
.section-kicker { color: #809088; font-size: 10px; font-weight: 800; letter-spacing: .14em; }
h2 { margin: 2px 0 0; color: #1d3027; font-size: 18px; }
.period { color: #819087; font-size: 12px; }
.history-alert { margin-top: 10px; }
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
