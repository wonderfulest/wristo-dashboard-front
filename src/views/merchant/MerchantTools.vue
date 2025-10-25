<template>
  <div class="merchant-tools-page">
    <div class="page-header">
      <h2>商家工具</h2>
    </div>
    <div class="tools-grid">
      <DesignerBulkToggle />
      <ReviewTimeControl />
    </div>
  </div>
</template>

<script setup lang="ts">
import DesignerBulkToggle from '@/components/dashboard/DesignerBulkToggle.vue'
import ReviewTimeControl from '@/components/dashboard/ReviewTimeControl.vue'
</script>

<style scoped>
.merchant-tools-page {
  padding: 16px;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.tools-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
</style>
