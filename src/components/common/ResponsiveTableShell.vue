<template>
  <div class="responsive-table-shell">
    <div class="desktop-table">
      <slot name="table" />
    </div>
    <div class="mobile-table" :class="{ 'is-scroll-mode': mobileMode === 'scroll' }">
      <slot v-if="$slots.mobile" name="mobile" />
      <div
        v-else
        class="mobile-table-scroll"
        role="region"
        aria-label="表格可横向滚动"
        tabindex="0"
      >
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
    position: relative;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-inline: contain;
    border-radius: 8px;
    box-shadow: inset -10px 0 12px -14px rgba(48, 49, 51, 0.6);
  }

  .mobile-table-scroll:focus-visible {
    outline: 2px solid rgba(25, 179, 107, 0.35);
    outline-offset: 2px;
  }

  .mobile-table-scroll :deep(.el-table) {
    min-width: 760px;
  }
}
</style>
