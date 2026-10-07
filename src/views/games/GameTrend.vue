<template><div ref="container" class="game-trend" role="img" aria-label="每日活跃、开局和完成局数趋势，下方提供每日数据表" /></template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { GameDaily } from '@/api/games'
echarts.use([LineChart, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent, CanvasRenderer])
const props = defineProps<{ items: GameDaily[] }>()
const container = ref<HTMLElement>()
let chart: echarts.ECharts | undefined
let observer: ResizeObserver | undefined
function render() {
  chart?.setOption({
    color: ['#168456', '#3b82f6', '#d99828'], tooltip: { trigger: 'axis' }, legend: { top: 0 },
    grid: { left: 50, right: 24, top: 48, bottom: 65 },
    xAxis: { type: 'category', data: props.items.map(d => d.date), boundaryGap: false },
    yAxis: { type: 'value', minInterval: 1 }, dataZoom: [{ type: 'inside' }, { type: 'slider', bottom: 0, height: 20 }],
    series: [
      { name: '日活', type: 'line', data: props.items.map(d => d.activePlayers) },
      { name: '开局次数', type: 'line', data: props.items.map(d => d.starts) },
      { name: '完成局数', type: 'line', data: props.items.map(d => d.completions) },
    ],
  }, true)
}
watch(() => props.items, render)
onMounted(() => { if (container.value) { chart = echarts.init(container.value); observer = new ResizeObserver(() => chart?.resize()); observer.observe(container.value); render() } })
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose() })
</script>
<style scoped>.game-trend { width: 100%; height: 330px; }</style>
