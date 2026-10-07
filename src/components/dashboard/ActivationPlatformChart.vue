<template><div ref="container" class="platform-chart" /></template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ActivationPlatformDaily } from '@/api/activationAnalytics'
import { platformTrend } from './activationPlatforms.mjs'
echarts.use([LineChart, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer])
const props = defineProps<{ dates: string[]; items: ActivationPlatformDaily[]; selected: string }>()
const container = ref<HTMLElement>()
let chart: echarts.ECharts | undefined
let observer: ResizeObserver | undefined
const render = () => chart?.setOption(platformTrend(props.dates, props.items, props.selected), true)
watch(() => [props.dates, props.items, props.selected], render)
onMounted(() => {
  if (!container.value) return
  chart = echarts.init(container.value)
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(container.value)
  render()
})
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose() })
</script>
<style scoped>.platform-chart { width: 100%; height: 340px; }</style>
