<template>
  <el-table-column v-if="selection" type="selection" fixed="left" :width="64" align="center" :resizable="false" />
  <el-table-column v-else column-key="row-actions-menu" label="操作" fixed="left" :width="64" align="center" :resizable="false">
    <template #default="scope">
      <TableActionMenu>
        <slot v-bind="scope" />
      </TableActionMenu>
    </template>
  </el-table-column>
</template>

<script setup lang="ts">
defineProps<{ selection?: boolean }>()

import TableActionMenu from './TableActionMenu.vue'
</script>
