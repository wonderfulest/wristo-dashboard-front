<template>
  <section class="control-bar" aria-label="首页数据筛选">
    <div>
      <div class="eyebrow">OPERATIONS PULSE</div>
      <h1>业务仪表盘</h1>
      <p>聚焦经营结果与今天需要处理的事项</p>
    </div>
    <div class="control-fields">
      <el-radio-group v-model="rangeType" size="small" @change="applyQuickRange">
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
        :clearable="false"
        @change="emitFilter"
      />
      <AppSearchSelect v-model="appId" width="260px" size="small" @change="emitFilter" />
      <el-button type="primary" size="small" @click="emitFilter">刷新数据</el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import { buildDashboardRange } from './dashboardOverview.mjs'
import type { DashboardFilter } from './dashboardTypes'

const props = defineProps<{ modelValue: DashboardFilter }>()
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
.control-bar { display: flex; justify-content: space-between; gap: 24px; padding: 22px 24px; border: 1px solid #dfe9e4; border-radius: 16px; background: linear-gradient(120deg, #f2faf6 0%, #fff 58%); box-shadow: 0 10px 30px rgba(28, 79, 55, .06); }
.eyebrow { color: #168456; font-size: 11px; font-weight: 800; letter-spacing: .16em; }
h1 { margin: 4px 0 2px; font-size: 25px; color: #173c2b; }
p { margin: 0; color: #708078; font-size: 13px; }
.control-fields { display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
@media (max-width: 1024px) { .control-bar { flex-direction: column; } .control-fields { justify-content: flex-start; } }
@media (max-width: 768px) { .control-bar { padding: 18px; } .control-fields { align-items: stretch; flex-direction: column; } .control-fields > * { width: 100% !important; } }
</style>
