<template>
  <el-card shadow="never">
    <h3>{{ title }}</h3>
    <p>{{ note }}</p>
    <el-table :data="items" row-key="key" empty-text="暂无用户数据" max-height="420">
      <el-table-column label="分类" min-width="100"><template #default="{ row }">{{ row.label }}</template></el-table-column>
      <el-table-column label="人数" width="90" align="right"><template #default="{ row }">
        <el-button link type="primary" :aria-label="`查看${row.label}用户`" @click="$emit('select', row)">{{ row.count.toLocaleString('zh-CN') }}</el-button>
      </template></el-table-column>
      <el-table-column label="占总用户" width="90" align="right"><template #default="{ row }">{{ total ? `${(row.count / total * 100).toFixed(1)}%` : '—' }}</template></el-table-column>
    </el-table>
  </el-card>
</template>
<script setup lang="ts">
import type { UserOverviewItem } from '@/api/userOverview'
defineProps<{ title: string; note: string; items: UserOverviewItem[]; total: number }>()
defineEmits<{ select: [item: UserOverviewItem] }>()
</script>
<style scoped>
h3 { margin: 0; font-size: 16px; }
p { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.7; min-height: 40px; }
</style>
