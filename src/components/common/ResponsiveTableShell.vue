<template>
  <div class="responsive-table-shell">
    <div class="desktop-table">
      <slot name="table" />
    </div>
    <div class="mobile-table" :class="{ 'is-scroll-mode': mobileMode === 'scroll' }">
      <slot v-if="$slots.mobile" name="mobile" />
      <div v-else class="mobile-table-scroll">
        <slot name="table" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  mobileMode?: 'cards' | 'scroll'
}>(), {
  mobileMode: 'scroll',
})
</script>

<style scoped>
.mobile-table {
  display: none;
}

@media (max-width: 768px) {
  .desktop-table {
    display: none;
  }

  .mobile-table {
    display: block;
  }

  .mobile-table-scroll {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .mobile-table-scroll :deep(.el-table) {
    min-width: 760px;
  }
}
</style>
