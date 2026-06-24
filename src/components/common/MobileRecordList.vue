<template>
  <div class="mobile-record-list" v-loading="loading">
    <el-empty v-if="!loading && items.length === 0" :description="emptyText" />
    <article
      v-for="(item, index) in items"
      v-else
      :key="getKey(item, index)"
      class="mobile-record-card"
    >
      <slot :item="item" :index="index" />
      <div v-if="$slots.actions" class="mobile-record-actions">
        <slot name="actions" :item="item" :index="index" />
      </div>
    </article>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
const props = withDefaults(defineProps<{
  items: T[]
  rowKey?: keyof T | ((item: T, index: number) => string | number)
  emptyText?: string
  loading?: boolean
}>(), {
  emptyText: '暂无数据',
  loading: false,
})

const getKey = (item: T, index: number) => {
  if (typeof props.rowKey === 'function') return props.rowKey(item, index)
  if (props.rowKey && item[props.rowKey] != null) return item[props.rowKey]
  return index
}
</script>

<style scoped>
.mobile-record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-record-card {
  padding: 14px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.mobile-record-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #f0f2f5;
}
</style>
