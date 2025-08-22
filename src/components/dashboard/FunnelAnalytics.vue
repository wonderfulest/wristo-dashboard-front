<template>
  <div class="dashboard-content">
    <h3 class="section-title">漏斗统计</h3>

    <div class="funnel-toolbar">
      <el-radio-group v-model="rangeType" size="small" @change="handleRangeTypeChange">
        <el-radio-button label="1d">近1天</el-radio-button>
        <el-radio-button label="3d">近3天</el-radio-button>
        <el-radio-button label="7d">近一周</el-radio-button>
        <el-radio-button label="30d">近一月</el-radio-button>
        <el-radio-button label="custom">自定义</el-radio-button>
      </el-radio-group>

      <el-date-picker
        v-if="rangeType === 'custom'"
        v-model="dateRange"
        type="datetimerange"
        range-separator="-"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        value-format="YYYY-MM-DD HH:mm"
        size="small"
      />

      <el-input v-model.number="appId" placeholder="应用ID(可选)" clearable size="small" style="width: 180px" />

      <el-button type="primary" size="small" :loading="funnelLoading" @click="fetchFunnel">查询</el-button>
      
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
      <p>获取漏斗统计失败：{{ funnelError }}</p>
    </div>

    <el-card shadow="never" :body-style="{ padding: '16px' }" v-loading="funnelLoading">
      <template #header>
        <div class="funnel-header">
          <span>统计周期：{{ funnel?.periodKey || displayPeriod }}</span>
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
import { getFunnel } from '@/api/purchase'
import type { AppFunnelVO, SalesQueryDTO } from '@/types/api'

// ===== Funnel state & methods =====
const funnel = ref<AppFunnelVO | null>(null)
const funnelLoading = ref(false)
const funnelError = ref<string | null>(null)
const rangeType = ref<'1d' | '3d' | '7d' | '30d' | 'custom'>('7d')
const dateRange = ref<[string, string] | null>(null)
const appId = ref<number | null>(null)

const formatNumber = (n: number | undefined) => {
  if (n === undefined || n === null) return '0'
  return Number(n).toLocaleString('en-US')
}

const formatPercent = (fromVal?: number, toVal?: number) => {
  if (!fromVal || fromVal <= 0 || !toVal) return '-'
  const pct = (toVal / fromVal) * 100
  return pct.toFixed(1) + '%'
}

const nowYMDHM = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

const offsetDayYMDHM = (offset: number) => {
  const d = new Date()
  d.setMinutes(d.getMinutes() + 0)
  d.setDate(d.getDate() + offset)
  return nowYMDHM(d)
}

const displayPeriod = ref('')

const applyRangeByType = () => {
  let start = ''
  let end = nowYMDHM()
  switch (rangeType.value) {
    case '1d': start = offsetDayYMDHM(-1); break
    case '3d': start = offsetDayYMDHM(-3); break
    case '7d': start = offsetDayYMDHM(-7); break
    case '30d': start = offsetDayYMDHM(-30); break
    case 'custom':
      if (dateRange.value) { start = dateRange.value[0]; end = dateRange.value[1] }
      break
  }
  if (start && end) {
    dateRange.value = [start, end]
    displayPeriod.value = `${start}~${end}`
  }
}

const handleRangeTypeChange = () => { applyRangeByType(); fetchFunnel() }

const fetchFunnel = async () => {
  try {
    funnelLoading.value = true
    funnelError.value = null
    if (!dateRange.value) applyRangeByType()
    if (!dateRange.value) { funnelError.value = '请选择时间范围'; return }
    const appIdVal = appId.value != null && !Number.isNaN(appId.value) ? appId.value : null
    const toDate = (s: string) => s?.split(' ')[0] || s
    const dto: SalesQueryDTO = {
      startDate: toDate(dateRange.value[0]),
      endDate: toDate(dateRange.value[1]),
      appId: appIdVal
    }
    const res = await getFunnel(dto)
    if (res.code === 0 && res.data) funnel.value = res.data
    else funnelError.value = res.msg || 'Failed to fetch funnel data'
  } catch (e) {
    funnelError.value = 'Network error occurred'
    console.error('Error fetching funnel:', e)
  } finally {
    funnelLoading.value = false
  }
}

const steps = [
  { label: '下载', key: 'downloads' as const },
  { label: '弹码', key: 'codeDisplayed' as const },
  { label: '输入码', key: 'codeEntered' as const },
  { label: '开始购买', key: 'startPurchase' as const },
  { label: '应用购买', key: 'appPurchases' as const },
  { label: '套餐购买', key: 'bundlePurchases' as const }
]

const stepVisible = ref<Record<string, boolean>>({
  downloads: true,
  codeDisplayed: true,
  codeEntered: true,
  startPurchase: true,
  appPurchases: true,
  bundlePurchases: true
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

// Auto-fetch when using custom range and user changes dates
watch(dateRange, (val) => {
  if (rangeType.value === 'custom' && val && val[0] && val[1]) {
    fetchFunnel()
  }
})

onMounted(() => { applyRangeByType(); fetchFunnel(); nextTick(() => initFunnelChart()) })

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (funnelChart) { funnelChart.dispose(); funnelChart = null }
})
</script>

<style scoped>
.dashboard-content { margin-top: 32px; }
.section-title { font-size: 18px; font-weight: 700; color: #212529; margin: 16px 0; }
.funnel-toolbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.funnel-header { display: flex; justify-content: space-between; font-size: 12px; color: #6c757d; }
.funnel-chart { width: 100%; height: 360px; margin-bottom: 12px; }
.funnel-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; }
.funnel-step { background: #fff; border: 1px solid #e9ecef; border-radius: 10px; padding: 12px; text-align: center; }
.funnel-step .step-title { font-size: 12px; color: #6c757d; }
.funnel-step .step-value { font-size: 22px; font-weight: 700; color: #1b4332; }
.funnel-step .step-rate { margin-top: 6px; font-size: 12px; color: #495057; }
.error-message { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 24px 0; color: #721c24; }
.step-toggle { display: inline-flex; align-items: center; gap: 8px; }
.toggle-label { color: #6c757d; font-size: 12px; }
</style>
