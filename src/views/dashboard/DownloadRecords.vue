<template>
  <div class="dashboard-page">
    <DashboardFilterBar eyebrow="DOWNLOAD ANALYTICS" title="下载分析" description="查看应用下载排行与设备上报明细" />
    <el-alert class="metric-note" type="info" :closable="false" show-icon title="首次下载按现存历史中的设备与表盘首次出现识别，历史重新上报单独统计；不等于新增用户或商店实际下载。日期按 UTC 统计。" />
    <div class="filter-bar">
      <span class="period">统计周期：{{ filter.startDate }} 至 {{ filter.endDate }}</span>
      <DashboardSectionFilter :model-value="filter" :show-app="false" @update:model-value="applyFilter" />
    </div>
    <DownloadCohortSummary :filter="filter" :revision="revision" />
    <el-tabs v-model="activeTab">
      <el-tab-pane label="应用排行" name="ranking">
        <AppDownloadRanking v-if="activeTab === 'ranking'" :filter="filter" :revision="revision" @view-records="viewRecords" />
      </el-tab-pane>
      <el-tab-pane label="下载明细" name="records">
        <DownloadRecordTable v-if="activeTab === 'records'" :start-date="filter.startDate" :end-date="filter.endDate" :revision="revision" :app-id="selectedAppId" :initial-type="selectedType" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DashboardFilterBar from '@/components/dashboard/DashboardFilterBar.vue'
import DashboardSectionFilter from '@/components/dashboard/DashboardSectionFilter.vue'
import AppDownloadRanking from '@/components/dashboard/AppDownloadRanking.vue'
import DownloadCohortSummary from '@/components/dashboard/DownloadCohortSummary.vue'
import DownloadRecordTable from '@/components/dashboard/DownloadRecordTable.vue'
import { buildDashboardRange } from '@/components/dashboard/dashboardOverview.mjs'
import type { DashboardFilter } from '@/components/dashboard/dashboardTypes'

const range = buildDashboardRange('30d')
const filter = ref<DashboardFilter>({ rangeType: '30d', startDate: range.startDate, endDate: range.endDate, appId: null })
const revision = ref(0)
const activeTab = ref('ranking')
const selectedAppId = ref<number | null>(null)
function applyFilter(value: DashboardFilter) {
  filter.value = value
  revision.value++
}
const selectedType = ref<'FIRST' | 'RETURNING' | ''>('')
function viewRecords(appId: number, type: 'FIRST' | 'RETURNING' | '' = '') {
  selectedType.value = type
  selectedAppId.value = appId
  activeTab.value = 'records'
}
</script>

<style scoped>
.dashboard-page { padding: 16px; max-width: 1480px; margin: 0 auto; min-width: 0; }
.metric-note { margin: 16px 0; }
.filter-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.period { color: var(--el-text-color-secondary); font-size: 13px; }
@media (max-width: 768px) { .dashboard-page { padding: 0; } }
</style>
