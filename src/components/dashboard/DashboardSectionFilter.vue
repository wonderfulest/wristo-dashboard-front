<template>
  <div class="section-filter">
    <el-radio-group v-model="rangeType" size="small" @change="applyQuickRange">
      <el-radio-button label="today">当日</el-radio-button>
      <el-radio-button label="yesterday">昨天</el-radio-button>
      <el-radio-button label="dayBeforeYesterday">前天</el-radio-button>
      <el-radio-button label="3d">近三天</el-radio-button>
      <el-radio-button label="7d">近 7 天</el-radio-button>
      <el-radio-button label="30d">近 30 天</el-radio-button>
      <el-radio-button label="custom">自定义</el-radio-button>
    </el-radio-group>
    <el-date-picker
      v-if="rangeType === 'custom'"
      v-model="dateRange"
      type="daterange"
      value-format="YYYY-MM-DD"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      size="small"
      :clearable="false"
      :disabled="loading"
      @change="emitFilter"
    />
    <AppSearchSelect
      v-model="appId"
      width="240px"
      size="small"
      :disabled="loading"
      @change="emitFilter"
    />
    <el-button type="primary" size="small" :loading="loading" @click="emitFilter">刷新数据</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import { buildDashboardRange } from './dashboardOverview.mjs'
import type { DashboardFilter } from './dashboardTypes'

const props = defineProps<{ modelValue: DashboardFilter; loading?: boolean }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: DashboardFilter): void }>()
const rangeType = ref<DashboardFilter['rangeType']>(props.modelValue.rangeType)
const dateRange = ref<[string, string]>([props.modelValue.startDate, props.modelValue.endDate])
const appId = ref<number | null>(props.modelValue.appId)

const emitFilter = () => {
  if (!dateRange.value?.[0] || !dateRange.value?.[1]) return
  emit('update:modelValue', {
    rangeType: rangeType.value,
    startDate: dateRange.value[0],
    endDate: dateRange.value[1],
    appId: appId.value,
  })
}

const applyQuickRange = () => {
  if (rangeType.value === 'custom') return
  const range = buildDashboardRange(rangeType.value)
  dateRange.value = [range.startDate, range.endDate]
  emitFilter()
}
</script>

<style scoped>
.section-filter { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
@media (max-width: 768px) {
  .section-filter { align-items: stretch; flex-direction: column; width: 100%; }
  .section-filter > * { width: 100% !important; }
}
</style>
