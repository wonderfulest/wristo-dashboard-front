<template>
  <section class="product-settings">
    <header><h2>积分充值</h2><p>管理国内产品共用的积分充值套餐。</p></header>
    <PointsRechargeSettings />
  </section>
</template>
<script setup lang="ts">
import PointsRechargeSettings from '@/components/PointsRechargeSettings.vue'
</script>
<style scoped>
.product-settings { padding: 20px; display: grid; gap: 16px; }
h2 { margin: 0; }
p { color: var(--el-text-color-secondary); }
</style>
