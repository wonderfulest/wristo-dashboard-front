<template>
  <div class="dashboard">
    <ReviewTimeControl />
    <div class="dashboard-content">
      <!-- 最近60天销售折线图 -->
      <SalesLineChart />

      <!-- 转化漏斗 -->
      <FunnelAnalytics />

      <!-- 设备型号订单统计 -->
      <DeviceOrderSummary />

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
import DeviceOrderSummary from '@/components/dashboard/DeviceOrderSummary.vue'
</script>

<style scoped>
.dashboard { padding: 16px; }
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
