<template>
  <div class="dashboard">
    <DashboardFilterBar v-model="dashboardFilter" />
    <BusinessOverview :filter="dashboardFilter" @metrics-change="handleMetricsChange" />
    <OperationsInbox />
    <ReviewTimeControl />
    <div class="dashboard-content">
      <!-- 最近60天销售折线图 -->
      <SalesLineChart :filter="dashboardFilter" />

      <!-- 转化漏斗 -->
      <FunnelAnalytics :filter="dashboardFilter" />

      <!-- 设备型号订单统计 -->
      <DeviceOrderSummary />

      <!-- 国家订单分布 -->
      <CountryOrderDistribution />

      <!-- 应用销售总计（分页） -->
      <AppSalesSummary />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ReviewTimeControl from '@/components/dashboard/ReviewTimeControl.vue'
import FunnelAnalytics from '@/components/dashboard/FunnelAnalytics.vue'
import AppSalesSummary from '@/components/dashboard/AppSalesSummary.vue'
import SalesLineChart from '@/components/dashboard/SalesLineChart.vue'
import DeviceOrderSummary from '@/components/dashboard/DeviceOrderSummary.vue'
import CountryOrderDistribution from '@/components/dashboard/CountryOrderDistribution.vue'
import DashboardFilterBar from '@/components/dashboard/DashboardFilterBar.vue'
import BusinessOverview from '@/components/dashboard/BusinessOverview.vue'
import OperationsInbox from '@/components/dashboard/OperationsInbox.vue'
import { buildDashboardRange } from '@/components/dashboard/dashboardOverview.mjs'
import type { DashboardMetrics } from '@/components/dashboard/dashboardOverview.mjs'
import type { DashboardFilter } from '@/components/dashboard/dashboardTypes'

const initialRange = buildDashboardRange('7d')
const dashboardFilter = ref<DashboardFilter>({
  rangeType: '7d',
  startDate: initialRange.startDate,
  endDate: initialRange.endDate,
  appId: null,
})
const latestMetrics = ref<DashboardMetrics | null>(null)
const handleMetricsChange = (metrics: DashboardMetrics) => { latestMetrics.value = metrics }
</script>

<style scoped>
.dashboard { padding: 16px; max-width: 1480px; margin: 0 auto; }
.dashboard-content { margin-top: 16px; display: grid; gap: 16px; }

@media (max-width: 768px) {
  .dashboard {
    padding: 0;
  }

  .dashboard-content {
    gap: 12px;
  }
}
</style>
