<template>
  <div class="dashboard">
    <h2>Dashboard</h2>
    <ReviewTimeControl />
    <div class="dashboard-content">
      <!-- 最近60天销售折线图 -->
      <SalesLineChart />

      <!-- 漏斗统计 -->
      <FunnelAnalytics />

      <!-- 应用销售总计（分页） -->
      <AppSalesSummary />
    </div>
  </div>
</template>

<script setup lang="ts">
import ReviewTimeControl from '@/components/dashboard/ReviewTimeControl.vue'
import FunnelAnalytics from '@/components/dashboard/FunnelAnalytics.vue'
import AppSalesSummary from '@/components/dashboard/AppSalesSummary.vue'
import SalesLineChart from '@/components/dashboard/SalesLineChart.vue'
</script>

<style scoped>
.dashboard { padding: 16px; }
.dashboard-content { margin-top: 16px; display: grid; gap: 16px; }
</style>