<template>
  <div class="config-page">
    <WechatHomeBanners class="banner-card" />
    <WatchfacePushConfig class="config-card" />
  </div>
</template>

<script setup lang="ts">
import WechatHomeBanners from '@/components/ops/WechatHomeBanners.vue'
import WatchfacePushConfig from '@/components/ops/WatchfacePushConfig.vue'
</script>

<style scoped>
.config-page { padding: 20px; }
.config-card { margin-top: 24px; }
.banner-card { background: var(--el-bg-color); border: 1px solid var(--el-border-color-light); border-radius: 4px; }
</style>
