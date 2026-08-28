<template>
  <div class="dashboard-page">
    <DashboardFilterBar
      eyebrow="SALES INTELLIGENCE"
      title="销售分析"
      description="分析收入趋势、购买转化与市场分布"
    />
    <div class="dashboard-content">
      <SalesLineChart />
      <FunnelAnalytics />
      <DeviceOrderSummary />
      <CountryOrderDistribution />
      <AppSalesSummary />
      <AppDownloadRanking />
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardFilterBar from '@/components/dashboard/DashboardFilterBar.vue'
import SalesLineChart from '@/components/dashboard/SalesLineChart.vue'
import FunnelAnalytics from '@/components/dashboard/FunnelAnalytics.vue'
import DeviceOrderSummary from '@/components/dashboard/DeviceOrderSummary.vue'
import CountryOrderDistribution from '@/components/dashboard/CountryOrderDistribution.vue'
import AppSalesSummary from '@/components/dashboard/AppSalesSummary.vue'
import AppDownloadRanking from '@/components/dashboard/AppDownloadRanking.vue'
</script>

<style scoped>
.dashboard-page { padding: 16px; max-width: 1480px; margin: 0 auto; }
.dashboard-content { display: grid; gap: 16px; }
@media (max-width: 768px) { .dashboard-page { padding: 0; } .dashboard-content { gap: 12px; } }
</style>
