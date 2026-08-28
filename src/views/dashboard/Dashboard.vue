<template>
  <div class="dashboard">
    <DashboardFilterBar />
    <BusinessOverview />
    <LaunchOperationsRecommendation />
    <LaunchCohortContribution />
    <LaunchLifecycleChart />
    <LaunchMarginalRevenue />
    <CategoryValueMatrix />
    <DesignerValueMatrix />
    <OperationsInbox />
    <ReviewTimeControl />
    <div class="dashboard-content">
      <!-- 最近60天销售折线图 -->
      <SalesLineChart />

      <!-- 转化漏斗 -->
      <FunnelAnalytics />

      <!-- 设备型号订单统计 -->
      <DeviceOrderSummary />

      <!-- 国家订单分布 -->
      <CountryOrderDistribution />

      <!-- 应用销售总计（分页） -->
      <AppSalesSummary />

      <!-- 应用下载量 Top 排序（分页） -->
      <AppDownloadRanking />
    </div>
  </div>
</template>

<script setup lang="ts">
import ReviewTimeControl from '@/components/dashboard/ReviewTimeControl.vue'
import FunnelAnalytics from '@/components/dashboard/FunnelAnalytics.vue'
import AppSalesSummary from '@/components/dashboard/AppSalesSummary.vue'
import AppDownloadRanking from '@/components/dashboard/AppDownloadRanking.vue'
import SalesLineChart from '@/components/dashboard/SalesLineChart.vue'
import DeviceOrderSummary from '@/components/dashboard/DeviceOrderSummary.vue'
import CountryOrderDistribution from '@/components/dashboard/CountryOrderDistribution.vue'
import DashboardFilterBar from '@/components/dashboard/DashboardFilterBar.vue'
import BusinessOverview from '@/components/dashboard/BusinessOverview.vue'
import OperationsInbox from '@/components/dashboard/OperationsInbox.vue'
import LaunchOperationsRecommendation from '@/components/dashboard/LaunchOperationsRecommendation.vue'
import LaunchCohortContribution from '@/components/dashboard/LaunchCohortContribution.vue'
import LaunchLifecycleChart from '@/components/dashboard/LaunchLifecycleChart.vue'
import LaunchMarginalRevenue from '@/components/dashboard/LaunchMarginalRevenue.vue'
import CategoryValueMatrix from '@/components/dashboard/CategoryValueMatrix.vue'
import DesignerValueMatrix from '@/components/dashboard/DesignerValueMatrix.vue'
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
