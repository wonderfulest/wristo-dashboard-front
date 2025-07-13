<template>
  <el-tag :type="statusColor" :effect="effect">
    {{ statusText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getPackagingStatusColor, getPackagingStatusText } from '@/utils/status'

interface Props {
  status: string
  effect?: 'dark' | 'light' | 'plain'
}

const props = withDefaults(defineProps<Props>(), {
  effect: 'light'
})

const statusColor = computed(() => getPackagingStatusColor(props.status))
const statusText = computed(() => getPackagingStatusText(props.status))
</script>

<style scoped>
.el-tag {
  font-weight: 500;
}
</style> 