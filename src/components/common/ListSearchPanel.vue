<template>
  <component :is="tag" class="list-search-panel" aria-label="搜索与筛选">
    <div v-if="$slots.default || $slots.query" class="list-search-panel__filters">
      <slot />
      <div v-if="$slots.query" class="list-search-panel__query">
        <slot name="query" />
      </div>
    </div>
    <div v-if="$slots.actions" class="list-search-panel__actions">
      <slot name="actions" />
    </div>
  </component>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ tag?: 'section' | 'form' }>(), { tag: 'section' })
</script>

<style lang="scss">
// Opt-in selectors: editor forms, dialogs and table actions are deliberately outside this system.
.list-search-panel {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin-bottom: 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color);

  &__filters {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 16px 14px;
    padding: 20px;
    min-width: 0;
  }

  .list-search-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1 1 180px;
    max-width: 280px;
    min-width: 0;

    &--wide { flex-basis: 260px; max-width: 340px; }
    &--range { flex-basis: 340px; max-width: 400px; }

    > :not(.list-search-label) {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100%;
      box-sizing: border-box;
    }
  }

  .list-search-form,
  .list-search-form .advanced-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 16px 14px;
    width: 100%;
    min-width: 0;
  }

  .list-search-form {
    .el-form-item {
      flex: 1 1 180px;
      min-width: 0;
      max-width: 280px;
      margin: 0;
    }

    .el-form-item:has(.el-date-editor--daterange),
    .el-form-item:has(.el-date-editor--datetimerange) {
      flex-basis: 340px;
      max-width: 400px;
    }

    .el-form-item:not(:has(.el-form-item__label)) {
      flex: 0 1 auto;
      max-width: none;
      margin-left: auto;
    }

    .el-form-item__label {
      height: auto;
      padding: 0;
      margin-bottom: 8px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      line-height: 18px;
    }

    .el-form-item__content { gap: 8px; min-width: 0; }
    .el-form-item__content > .el-button { margin: 0; min-height: 36px; }
    .el-input, .el-select, .el-date-editor {
      width: 100% !important;
      min-width: 0;
      box-sizing: border-box;
    }
  }

  .list-search-label {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
  }

  .el-input__wrapper,
  .el-select__wrapper {
    min-height: 36px;
    box-sizing: border-box;
    border-radius: 6px;
  }

  &__query,
  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    > .el-button,
    > .el-dropdown > .el-button { min-height: 36px; margin: 0; }
  }

  &__query { margin-left: auto; }

  &__actions:first-child { border-top: 0; border-radius: 12px; }

  &__actions {
    padding: 14px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    border-radius: 0 0 12px 12px;
    background: var(--el-fill-color-light);
  }

  input.filter-input {
    height: 36px;
    padding: 0 11px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    background: var(--el-fill-color-blank);
    color: var(--el-text-color-regular);
    font: inherit;

    &:focus { outline: 2px solid var(--el-color-primary-light-7); border-color: var(--el-color-primary); }
  }
}

// Several existing pages place their title and filters in a flex header.
.header:has(> .list-search-panel),
.page-header:has(> .list-search-panel),
.search-header:has(> .list-search-panel) {
  flex-wrap: wrap;
  align-items: stretch;

  > .list-search-panel { flex-basis: 100%; margin-bottom: 0; }
}

@media (max-width: 640px) {
  .list-search-panel {
    margin-bottom: 14px;

    &__filters { padding: 16px; gap: 14px 12px; }
    .list-search-field { flex-basis: calc(50% - 6px); max-width: none; }
    .list-search-field--wide,
    .list-search-field--range { flex-basis: 100%; }
    .list-search-form .el-form-item { flex-basis: 100%; max-width: none; }
    .list-search-form .el-form-item:not(:has(.el-form-item__label)) { margin-left: 0; }
    &__query { width: 100%; margin-left: 0; }
    &__query > .el-button { flex: 1; }
    &__actions { padding: 12px 16px; }
  }
}
</style>
