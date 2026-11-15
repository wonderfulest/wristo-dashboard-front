<template>
  <div class="config-page">
    <CompanionAppsConfig class="config-card" />
  </div>
</template>

<script setup lang="ts">
import CompanionAppsConfig from '@/components/ops/CompanionAppsConfig.vue'
</script>

<style scoped>
.config-page { padding: 20px; }
.config-card { margin-top: 0; }
</style>
