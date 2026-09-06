<template><div ref="container" class="activation-chart" /></template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ActivationDaily } from '@/api/activationAnalytics'
import { createActivationChart } from './activationCharts.mjs'

echarts.use([LineChart, BarChart, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent, CanvasRenderer])
const props = defineProps<{ items: ActivationDaily[]; trackingStartedAt: string | null; mode: 'trend' | 'count' | 'percent' }>()
const container = ref<HTMLElement>()
let chart: echarts.ECharts | undefined
let observer: ResizeObserver | undefined
const render = () => chart?.setOption(createActivationChart(props.items, props.trackingStartedAt, props.mode), true)
watch(() => [props.items, props.mode, props.trackingStartedAt], render)
onMounted(() => {
  if (!container.value) return
  chart = echarts.init(container.value)
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(container.value)
  render()
})
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose() })
</script>

<style scoped>
.activation-chart { width: 100%; height: 350px; }
</style>
