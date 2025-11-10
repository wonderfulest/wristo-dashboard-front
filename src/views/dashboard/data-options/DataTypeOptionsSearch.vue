<template>
  <div class="header">
    <div class="filters">
      <el-select v-model="localQuery.category" placeholder="Category" clearable style="width: 160px">
        <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
      </el-select>
      <el-select v-model="localQuery.active" placeholder="Active" clearable style="width: 120px">
        <el-option :value="1" label="Active" />
        <el-option :value="0" label="Inactive" />
      </el-select>
      <el-input v-model="localQuery.keyword" placeholder="Keyword (label/标签/metric)" clearable style="width: 220px" />
      <el-button type="primary" @click="onSearch">Search</el-button>
      <el-button type="primary" @click="$emit('add')">Add</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { PropType } from 'vue'
import type { DataTypeOptionPageQueryDTO } from '@/types/data-type-option'

const props = defineProps({
  categories: { type: Array as PropType<string[]>, default: () => [] },
  query: { type: Object as PropType<Partial<DataTypeOptionPageQueryDTO>>, required: true }
})

const emit = defineEmits<{
  (e: 'update:query', v: Partial<DataTypeOptionPageQueryDTO>): void
  (e: 'search'): void
  (e: 'add'): void
}>()

const localQuery = reactive<Partial<DataTypeOptionPageQueryDTO>>({ ...props.query })

watch(() => props.query, (v) => {
  Object.assign(localQuery, v || {})
})

watch(localQuery, (v) => {
  emit('update:query', { ...v })
}, { deep: true })

function onSearch() {
  emit('search')
}
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { display: flex; gap: 12px; align-items: center; }
</style>
