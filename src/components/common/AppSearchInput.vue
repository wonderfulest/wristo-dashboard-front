<template>
  <el-input
    :model-value="modelValue"
    placeholder="输入应用名称或 App ID"
    clearable
    @update:model-value="$emit('update:modelValue', $event)"
    @keyup.enter="$emit('search')"
    @clear="$emit('search')"
  />
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>()
defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search'): void
}>()
</script>
