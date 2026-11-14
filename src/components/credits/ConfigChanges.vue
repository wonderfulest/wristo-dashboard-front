<template>
  <details>
    <summary>查看变更（{{ changes.length }} 项）</summary>
    <p v-if="!before" class="hint">没有记录旧值，不能据此推断原默认额度。</p>
    <table v-if="changes.length" class="changes"><thead><tr><th>配置项</th><th>修改前</th><th>修改后</th></tr></thead><tbody><tr v-for="change in changes" :key="change.field"><th>{{ change.field }}</th><td>{{ change.before }}</td><td>{{ change.after }}</td></tr></tbody></table>
    <p v-else class="hint">没有字段差异。</p>
    <details><summary>原始记录</summary><p>修改前</p><pre>{{ before ?? '未记录' }}</pre><p>修改后</p><pre>{{ after ?? '未记录' }}</pre></details>
  </details>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { configChanges } from '@/utils/configChanges'
const props = defineProps<{ before?: unknown; after?: unknown }>()
const changes = computed(() => configChanges(props.before, props.after))
</script>
<style scoped>
summary { cursor: pointer; color: var(--el-color-primary); font-size: 13px; }details details { margin-top: 12px; }.hint { color: var(--el-text-color-secondary); font-size: 12px; }.changes { width: 100%; border-collapse: collapse; margin: 10px 0; table-layout: fixed; }.changes th,.changes td { text-align: left; padding: 8px; border-bottom: 1px solid var(--el-border-color-lighter); font-size: 12px; overflow-wrap: anywhere; }.changes td:last-child { color: var(--el-color-primary); }pre { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
