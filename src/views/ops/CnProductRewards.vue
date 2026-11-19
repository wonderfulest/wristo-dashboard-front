<template>
  <section class="product-settings">
    <header><h2>国内网站奖励与兑换</h2><p>管理国内网站任务奖励、默认兑换额度和表盘覆盖配置。</p></header>
    <CnRewardAmountsSettings />
  </section>
</template>
<script setup lang="ts">
import CnRewardAmountsSettings from '@/components/CnRewardAmountsSettings.vue'
</script>
<style scoped>
.product-settings { padding: 20px; display: grid; gap: 16px; }
h2 { margin: 0; }
p { color: var(--el-text-color-secondary); }
</style>
