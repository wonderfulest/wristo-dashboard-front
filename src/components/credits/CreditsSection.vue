<template>
  <section class="credits-section">
    <header class="credits-heading"><div><h2>{{ title }}</h2><p>{{ description }}</p></div><slot name="actions" /></header>
    <nav class="credits-tabs" aria-label="页面分类">
      <router-link v-for="tab in tabs" :key="tab.key" :to="{ path: route.path, query: { ...route.query, tab: tab.key } }" :class="{ selected: selected === tab.key }" :aria-current="selected === tab.key ? 'page' : undefined">{{ tab.label }}</router-link>
    </nav>
    <div class="credits-embedded"><slot :selected="selected" /></div>
  </section>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const props = defineProps<{ title: string; description: string; tabs: { key: string; label: string }[] }>()
const route = useRoute()
const selected = computed(() => props.tabs.some(tab => tab.key === route.query.tab) ? String(route.query.tab) : props.tabs[0].key)
</script>
<style scoped>
.credits-section { padding: 20px; display: grid; gap: 16px; min-width: 0; }
.credits-heading { display: flex; justify-content: space-between; align-items: start; gap: 12px; flex-wrap: wrap; }
h2 { margin: 0; font-size: 22px; } p { margin: 6px 0 0; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.6; }
.credits-tabs { display: flex; flex-wrap: wrap; gap: 6px; border-bottom: 1px solid var(--el-border-color-light); padding-bottom: 12px; }
.credits-tabs a { color: var(--el-text-color-regular); text-decoration: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; }
.credits-tabs a:hover { background: var(--el-fill-color-light); }.credits-tabs a.selected { color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-weight: 600; }
.credits-embedded { min-width: 0; }.credits-embedded :deep(> div) { padding: 0; }.credits-embedded :deep(h2) { font-size: 17px; }
@media(max-width:600px) { .credits-section { padding: 12px; }.credits-tabs a { padding: 8px 10px; } }
</style>
