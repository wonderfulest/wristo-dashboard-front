<template>
  <div class="dashboard-page">
    <DashboardFilterBar
      eyebrow="LAUNCH INTELLIGENCE"
      title="上线策略"
      description="评估上线节奏、生命周期与新增应用的边际价值"
    />
    <LaunchOperationsRecommendation @trained="refreshAnalytics" />
    <LaunchCohortContribution :key="analyticsRevision" />
    <LaunchSalesInsights :key="analyticsRevision" />
    <LaunchLifecycleChart :key="analyticsRevision" />
    <LaunchMarginalRevenue :key="analyticsRevision" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DashboardFilterBar from '@/components/dashboard/DashboardFilterBar.vue'
import LaunchOperationsRecommendation from '@/components/dashboard/LaunchOperationsRecommendation.vue'
import LaunchCohortContribution from '@/components/dashboard/LaunchCohortContribution.vue'
import LaunchSalesInsights from '@/components/dashboard/LaunchSalesInsights.vue'
import LaunchLifecycleChart from '@/components/dashboard/LaunchLifecycleChart.vue'
import LaunchMarginalRevenue from '@/components/dashboard/LaunchMarginalRevenue.vue'

const analyticsRevision = ref(0)
const refreshAnalytics = () => { analyticsRevision.value += 1 }
</script>

<style scoped>
.dashboard-page { padding: 16px; max-width: 1480px; margin: 0 auto; }
@media (max-width: 768px) { .dashboard-page { padding: 0; } }
</style>
