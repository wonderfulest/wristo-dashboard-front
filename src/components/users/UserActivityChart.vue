<template><div ref="element" class="activity-chart" role="img" aria-label="各端每日活跃用户趋势，具体数值见下方明细表" /></template>
<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { ActivityDay } from '@/api/userActivity'
import { registrationSourceLabels } from './userOverview.mjs'
const props = defineProps<{ rows: ActivityDay[]; platforms: string[] }>()
const element = ref<HTMLDivElement>()
let chart: echarts.ECharts | undefined
let observer: ResizeObserver | undefined
function render() {
  chart?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { type: 'scroll', top: 0 },
    grid: { left: 55, right: 24, top: 45, bottom: 65 },
    xAxis: { type: 'category', data: props.rows.map(row => row.date) },
    yAxis: { type: 'value', minInterval: 1 },
    dataZoom: props.rows.length > 60 ? [{ type: 'slider', bottom: 0 }] : [],
    series: [
      { name: '所选端去重日活', type: 'line', data: props.rows.map(row => row.total), lineStyle: { width: 3 }, connectNulls: false },
      ...props.platforms.map(key => ({ name: registrationSourceLabels[key] || key, type: 'line',
        data: props.rows.map(row => row.platforms[key] ?? null), showSymbol: props.rows.length < 40, connectNulls: false })),
    ],
  }, true)
}
onMounted(() => {
  if (!element.value) return
  chart = echarts.init(element.value)
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(element.value)
  render()
})
watch(() => [props.rows, props.platforms], async () => { await nextTick(); render() })
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose() })
</script>
<style scoped>.activity-chart { width: 100%; height: 340px; min-width: 0; }</style>
