<template>
  <div class="dashboard-content">
    <div class="section-heading">
      <h3 class="section-title">首次下载转化分析</h3>
      <DashboardSectionFilter v-model="filter" :loading="funnelLoading" />
    </div>

    <p class="funnel-note">按所选 UTC 日期首次出现的设备与表盘分组，观察截至当前的后续状态及成功购买；历史重新上报不进入本漏斗。购买设备去重，包含应用与覆盖该表盘的套餐，历史比例会随延迟购买更新。中间层级包含已完成购买的设备。</p>
    <p v-if="funnel" class="funnel-note">全部上报 {{ formatNumber(funnel.downloads) }} · 历史重新上报 {{ formatNumber(funnel.repeatDownloads) }}（{{ formatNumber(funnel.returningDevices) }} 个设备与表盘）· 回流后购买 {{ formatNumber(funnel.returningPurchasedDevices) }}</p>
    <div class="funnel-toolbar">
      <div class="step-toggle">
        <span class="toggle-label">显示层级：</span>
        <el-checkbox
          v-for="s in steps"
          :key="s.key"
          v-model="stepVisible[s.key]"
          @change="updateFunnelChart"
          size="small"
        >{{ s.label }}</el-checkbox>
        <el-button link size="small" @click="setAllVisible(true)">全选</el-button>
        <el-button link size="small" @click="setAllVisible(false)">全不选</el-button>
      </div>
    </div>

    <div v-if="funnelError" class="error-message">
      <p>获取转化漏斗失败：{{ funnelError }}</p>
    </div>

    <el-card shadow="never" :body-style="{ padding: '16px' }" v-loading="funnelLoading">
      <template #header>
        <div class="funnel-header">
          <span>统计周期：{{ displayPeriod }}</span>
          <span v-if="funnel && funnel.app">应用：{{ funnel.app.name }} (ID: {{ funnel.appId }})</span>
        </div>
      </template>

      <div ref="funnelChartRef" class="funnel-chart"></div>

      <div v-if="funnel" class="funnel-steps">
        <div class="funnel-step" v-for="(s, idx) in visibleSteps" :key="s.key">
          <div class="step-title">{{ s.label }}</div>
          <div class="step-value">{{ formatNumber(getFunnelVal(s.key)) }}</div>
          <div class="step-rate" v-if="idx > 0">
            转化率：{{ formatPercent(getFunnelVal(visibleSteps[idx-1].key), getFunnelVal(s.key)) }}
          </div>
        </div>
      </div>

      <div v-else class="loading-text">请选择时间范围后查询</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import DashboardSectionFilter from './DashboardSectionFilter.vue'
import { getFunnel } from '@/api/purchase'
import type { AppFunnelVO, SalesQueryDTO } from '@/types/api'
import { buildDashboardRange } from './dashboardOverview.mjs'
import type { DashboardFilter } from './dashboardTypes'

// ===== Funnel state & methods =====
const funnel = ref<AppFunnelVO | null>(null)
const funnelLoading = ref(false)
const funnelError = ref<string | null>(null)
const initialRange = buildDashboardRange('7d')
const filter = ref<DashboardFilter>({ rangeType: '7d', startDate: initialRange.startDate, endDate: initialRange.endDate, appId: null })

const formatNumber = (n: number | undefined) => {
  if (n === undefined || n === null) return '0'
  return Number(n).toLocaleString('en-US')
}

const formatPercent = (fromVal?: number, toVal?: number) => {
  if (!fromVal || fromVal <= 0 || toVal == null) return '-'
  const pct = (toVal / fromVal) * 100
  return pct.toFixed(1) + '%'
}

const displayPeriod = ref(initialRange.displayPeriod)

let funnelRequest = 0
const fetchFunnel = async () => {
  const request = ++funnelRequest
  try {
    funnelLoading.value = true
    funnel.value = null
    funnelError.value = null
    displayPeriod.value = `${filter.value.startDate} 至 ${filter.value.endDate}`
    const appIdVal = filter.value.appId != null && !Number.isNaN(filter.value.appId) ? filter.value.appId : null
    const dto: SalesQueryDTO = {
      startDate: filter.value.startDate,
      endDate: filter.value.endDate,
      appId: appIdVal
    }
    const res = await getFunnel(dto)
    if (request !== funnelRequest) return
    if (res.code === 0 && res.data && res.data.firstDownloads != null && res.data.purchasedDevices != null) funnel.value = res.data
    else funnelError.value = res.msg || 'Failed to fetch funnel data'
  } catch (e) {
    if (request !== funnelRequest) return
    funnelError.value = 'Network error occurred'
    console.error('Error fetching funnel:', e)
  } finally {
    if (request === funnelRequest) funnelLoading.value = false
  }
}

const steps = [
  { label: '首次下载', key: 'firstDownloads' as const },
  { label: '弹码', key: 'codeDisplayed' as const },
  { label: '输入码', key: 'codeEntered' as const },
  { label: '开始购买', key: 'startPurchase' as const },
  { label: '成功购买设备', key: 'purchasedDevices' as const }
]

const stepVisible = ref<Record<string, boolean>>({
  firstDownloads: true,
  codeDisplayed: true,
  codeEntered: true,
  startPurchase: true,
  purchasedDevices: true
})

const setAllVisible = (val: boolean) => {
  Object.keys(stepVisible.value).forEach(k => (stepVisible.value[k] = val))
  updateFunnelChart()
}

const visibleSteps = computed(() => steps.filter(s => stepVisible.value[s.key]))
const getFunnelVal = (key: typeof steps[number]['key']): number => (funnel.value as any)?.[key] ?? 0

// ===== ECharts Funnel =====
const funnelChartRef = ref<HTMLElement | null>(null)
let funnelChart: any = null
let echartsMod: any = null

const initFunnelChart = async () => {
  if (!funnelChartRef.value) return
  echartsMod = await import('echarts/core')
  const { FunnelChart } = await import('echarts/charts')
  const { TooltipComponent } = await import('echarts/components')
  const { CanvasRenderer } = await import('echarts/renderers')
  echartsMod.use([FunnelChart, TooltipComponent, CanvasRenderer])
  funnelChart = echartsMod.init(funnelChartRef.value)
  updateFunnelChart()
  window.addEventListener('resize', handleResize)
}

const handleResize = () => { if (funnelChart) funnelChart.resize() }

const updateFunnelChart = async () => {
  if (!funnelChartRef.value) { await nextTick(); if (!funnelChartRef.value) return }
  if (!funnelChart) { await initFunnelChart(); if (!funnelChart) return }
  const vs = visibleSteps.value
  const data = vs.map((s, idx) => {
    const v = getFunnelVal(s.key)
    const prev = idx > 0 ? getFunnelVal(vs[idx - 1].key) : 0
    const rate = idx > 0 && prev > 0 ? `${((v / prev) * 100).toFixed(1)}%` : '-'
    return { name: s.label, value: v, rate }
  })
  const gradients: Array<[string, string]> = [
    ['#ecfbf4', '#bfe9d3'],
    ['#e4f8ef', '#a9e0c6'],
    ['#dbf4e9', '#90d7b6'],
    ['#d1efe2', '#74cba3'],
    ['#c6e9da', '#56bd90'],
    ['#bae3d1', '#2f9e6e']
  ]
  const option = {
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: ${p.value}${p.data?.rate ? `<br/>转化率：${p.data.rate}` : ''}` },
    series: [
      {
        type: 'funnel', left: '10%', top: 20, bottom: 20, width: '80%', minSize: '15%', maxSize: '100%', sort: 'none', gap: 2,
        label: { show: true, position: 'left', formatter: (p: any) => `${p.name}: ${p.value}` },
        labelLine: { show: true, length: 10, lineStyle: { color: '#9aa39f' } },
        itemStyle: {
          borderColor: '#fff', borderWidth: 1,
          color: (params: any) => {
            const idx = Math.min(params.dataIndex, gradients.length - 1)
            const [start, end] = gradients[idx]
            return new echartsMod.graphic.LinearGradient(0, 0, 0, 1, [ { offset: 0, color: start }, { offset: 1, color: end } ])
          }
        },
        data
      },
      {
        type: 'funnel', left: '10%', top: 20, bottom: 20, width: '80%', minSize: '15%', maxSize: '100%', sort: 'none', gap: 2,
        silent: true, tooltip: { show: false },
        label: { show: true, position: 'right', formatter: (p: any) => (p.data?.rate && p.data.rate !== '-' ? `转化率：${p.data.rate}` : ''), color: '#2f7a53' },
        labelLine: { show: true, length: 10, lineStyle: { color: '#9aa39f' } },
        itemStyle: { color: 'rgba(0,0,0,0)', borderColor: 'rgba(0,0,0,0)' },
        data
      }
    ]
  }
  funnelChart.setOption(option, true)
  setTimeout(() => funnelChart && funnelChart.resize(), 0)
}

watch(funnel, () => updateFunnelChart())
watch(filter, fetchFunnel, { deep: true })

onMounted(() => { fetchFunnel(); nextTick(() => initFunnelChart()) })

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (funnelChart) { funnelChart.dispose(); funnelChart = null }
})
</script>

<style scoped>
.funnel-note { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }
.dashboard-content { margin-top: 32px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 16px 0 12px; }
.section-title { font-size: 18px; font-weight: 700; color: #212529; margin: 0; text-align: left; }
.funnel-toolbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.funnel-header { display: flex; justify-content: space-between; font-size: 12px; color: #6c757d; }
.funnel-chart { width: 100%; height: 360px; margin-bottom: 12px; }
.funnel-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; }
.funnel-step { background: #fff; border: 1px solid #e9ecef; border-radius: 10px; padding: 12px; text-align: left; }
.funnel-step .step-title { font-size: 12px; color: #6c757d; }
.funnel-step .step-value { font-size: 22px; font-weight: 700; color: #1b4332; }
.funnel-step .step-rate { margin-top: 6px; font-size: 12px; color: #495057; }
.error-message { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 24px 0; color: #721c24; }
.step-toggle { display: inline-flex; align-items: center; gap: 8px; }
.toggle-label { color: #6c757d; font-size: 12px; }

@media (max-width: 768px) {
  .dashboard-content { margin-top: 18px; }
  .section-heading { align-items: stretch; flex-direction: column; }
  .funnel-toolbar,
  .step-toggle {
    align-items: stretch;
    width: 100%;
    flex-direction: column;
  }
  .funnel-header {
    flex-direction: column;
    gap: 4px;
  }
  .funnel-chart { height: 320px; min-height: 320px; }
}
</style>
