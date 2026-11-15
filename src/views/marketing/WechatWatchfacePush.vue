<template>
  <div class="config-page">
    <WatchfacePushConfig class="config-card" />
  </div>
</template>

<script setup lang="ts">
import WatchfacePushConfig from '@/components/ops/WatchfacePushConfig.vue'
</script>

<style scoped>
.config-page { padding: 20px; }
.config-card { margin-top: 0; }
</style>
