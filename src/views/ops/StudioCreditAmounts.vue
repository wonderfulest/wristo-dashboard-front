<template>
  <section class="product-settings">
    <header><h2>套餐 AI 点数</h2><p>管理 Studio 套餐到账 AI 点数，AI 点数仅用于 Studio。</p></header>
    <StudioCreditAmountsSettings />
  </section>
</template>
<script setup lang="ts">
import StudioCreditAmountsSettings from '@/components/StudioCreditAmountsSettings.vue'
</script>
<style scoped>
.product-settings { padding: 20px; display: grid; gap: 16px; }
h2 { margin: 0; }
p { color: var(--el-text-color-secondary); }
</style>
