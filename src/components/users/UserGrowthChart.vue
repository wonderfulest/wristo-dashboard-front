<template><div ref="element" class="growth-chart" role="img" aria-label="新增用户趋势图，具体数值和用户链接见下方明细表" /></template>
<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { UserGrowthRow } from '@/api/userOverview'
const props = defineProps<{ rows: UserGrowthRow[] }>()
const element = ref<HTMLDivElement>()
let chart: echarts.ECharts | undefined
let observer: ResizeObserver | undefined
function render() {
  chart?.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 55, right: 24, top: 24, bottom: 65 },
    xAxis: { type: 'category', data: props.rows.map(row => row.from === row.to ? row.from : `${row.from} ~ ${row.to}`) },
    yAxis: { type: 'value', minInterval: 1 },
    dataZoom: props.rows.length > 60 ? [{ type: 'slider', bottom: 0, start: 0, end: 100 }] : [],
    series: [{ name: '新增用户', type: 'line', data: props.rows.map(row => row.count), showSymbol: props.rows.length < 40,
      itemStyle: { color: '#409eff' }, areaStyle: { opacity: 0.08 } }],
  }, true)
}
onMounted(() => {
  if (!element.value) return
  chart = echarts.init(element.value)
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(element.value)
  render()
})
watch(() => props.rows, async () => { await nextTick(); render() })
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose() })
</script>
<style scoped>.growth-chart { width: 100%; height: 320px; min-width: 0; }</style>
