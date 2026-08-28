<template>
  <div class="dashboard">
    <DashboardFilterBar />
    <BusinessOverview />
    <DesignOutputOverview />
    <OperationsInbox />
    <ReviewTimeControl />
  </div>
</template>

<script setup lang="ts">
import ReviewTimeControl from '@/components/dashboard/ReviewTimeControl.vue'
import DashboardFilterBar from '@/components/dashboard/DashboardFilterBar.vue'
import BusinessOverview from '@/components/dashboard/BusinessOverview.vue'
import DesignOutputOverview from '@/components/dashboard/DesignOutputOverview.vue'
import OperationsInbox from '@/components/dashboard/OperationsInbox.vue'
</script>

<style scoped>
.dashboard { padding: 16px; max-width: 1480px; margin: 0 auto; }

@media (max-width: 768px) {
  .dashboard {
    padding: 0;
  }

}
</style>
