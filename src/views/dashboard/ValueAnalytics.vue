<template>
  <div class="dashboard-page">
    <DashboardFilterBar
      eyebrow="PORTFOLIO VALUE"
      title="价值分析"
      description="比较品类与设计师的规模、效率和稳定性"
    />
    <CategoryValueMatrix />
    <DesignerValueMatrix />
  </div>
</template>

<script setup lang="ts">
import DashboardFilterBar from '@/components/dashboard/DashboardFilterBar.vue'
import CategoryValueMatrix from '@/components/dashboard/CategoryValueMatrix.vue'
import DesignerValueMatrix from '@/components/dashboard/DesignerValueMatrix.vue'
</script>

<style scoped>
.dashboard-page { padding: 16px; max-width: 1480px; margin: 0 auto; }
@media (max-width: 768px) { .dashboard-page { padding: 0; } }
</style>
