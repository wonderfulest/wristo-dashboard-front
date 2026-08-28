<template>
  <section class="analytics-section" v-loading="loading">
    <header>
      <div><span class="kicker">COHORT SALES</span><h2>首发效果总览</h2></div>
      <DashboardSectionFilter v-model="filter" :loading="loading" :show-app="false" />
    </header>
    <p class="period">首次上线日期：{{ filter.startDate }} 至 {{ filter.endDate }}（UTC）</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-alert v-else-if="data?.estimatedHistory" title="历史上线及销售数据为低可信度估算；语言和设备覆盖按当前商品状态回填。本功能上线后的新数据将准确记录。" type="warning" :closable="false" show-icon />
    <el-alert v-else-if="data?.partial" title="部分作品的 7 天或 30 天观察期尚未完成，未纳入对应窗口平均值。" type="info" :closable="false" show-icon />

    <div v-if="data" class="headline-grid">
      <article><span>新上线作品</span><strong>{{ data.launchCount }}</strong></article>
      <article><span>7 天完整样本</span><strong>{{ data.first7Days.completedLaunchCount }}</strong></article>
      <article><span>30 天完整样本</span><strong>{{ data.first30Days.completedLaunchCount }}</strong></article>
      <article><span>新品销售贡献率（30 天）</span><strong>{{ percent(data.first30Days.newProductContributionRate) }}</strong></article>
    </div>
    <div v-if="data" class="window-grid">
      <div v-for="window in windows" :key="window.label" class="window-card">
        <h3>{{ window.label }}</h3>
        <dl><template v-for="metric in window.metrics" :key="metric.label"><dt>{{ metric.label }}</dt><dd>{{ metric.value }}</dd></template></dl>
      </div>
    </div>

    <div class="subsection-heading"><div><span class="kicker">LAG RELATIONSHIP</span><h2>上线与销量趋势</h2></div></div>
    <div v-if="data" class="correlation-grid">
      <article><span>上线数 ↔ 后续 7 天销量</span><strong>{{ correlation(data.correlation7Days) }}</strong></article>
      <article><span>上线数 ↔ 后续 30 天销量</span><strong>{{ correlation(data.correlation30Days) }}</strong></article>
      <p>相关性仅描述历史同向变化，不代表上线数量直接导致销量变化。</p>
    </div>
    <div class="chart-scroll" role="region" aria-label="上线与销量趋势图可横向滚动" tabindex="0"><div ref="chartElement" class="chart"></div></div>

    <div class="subsection-heading"><div><span class="kicker">BREAKDOWN</span><h2>维度拆分</h2></div></div>
    <el-radio-group v-model="selectedDimension" size="small" class="dimension-tabs">
      <el-radio-button label="DESIGNER">设计师</el-radio-button>
      <el-radio-button label="CATEGORY">主分类</el-radio-button>
      <el-radio-button label="PRICE">价格区间</el-radio-button>
      <el-radio-button label="LANGUAGE">语言</el-radio-button>
      <el-radio-button label="DEVICE_COVERAGE">设备覆盖</el-radio-button>
    </el-radio-group>
    <ResponsiveTableShell v-if="dimensionRows.length">
      <template #table>
        <el-table :data="dimensionRows" size="small">
          <el-table-column prop="label" label="分组" min-width="140" fixed />
          <el-table-column prop="launchCount" label="上线数" width="90" />
          <el-table-column prop="directOrders" label="直接购买" width="100" />
          <el-table-column prop="bundleOrders" label="Bundle 归因" width="110" />
          <el-table-column label="净收入" width="110"><template #default="{row}">{{ money(row.netRevenueCents) }}</template></el-table-column>
          <el-table-column label="退款金额" width="110"><template #default="{row}">{{ money(row.refundCents) }}</template></el-table-column>
          <el-table-column label="单品平均净收入" min-width="140"><template #default="{row}">{{ money(row.averageNetRevenueCents) }}</template></el-table-column>
        </el-table>
      </template>
    </ResponsiveTableShell>
    <el-empty v-else-if="!loading && !error" description="当前维度暂无完整 30 天样本" :image-size="72" />
  </section>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getLaunchSalesInsights } from '@/api/launch-analytics'
import ResponsiveTableShell from '@/components/common/ResponsiveTableShell.vue'
import DashboardSectionFilter from './DashboardSectionFilter.vue'
import { buildDashboardRange } from './dashboardOverview.mjs'
import type { DashboardFilter } from './dashboardTypes'
import type { LaunchSalesInsights } from '@/types/launch-analytics'
import { buildBottomLineChartLayout } from './dashboardChartOptions.mjs'

const initialRange = buildDashboardRange('30d')
const filter = ref<DashboardFilter>({ rangeType:'30d', startDate:initialRange.startDate, endDate:initialRange.endDate, appId:null })
const loading=ref(false),error=ref(''),data=ref<LaunchSalesInsights|null>(null)
const selectedDimension=ref<'DESIGNER'|'CATEGORY'|'PRICE'|'LANGUAGE'|'DEVICE_COVERAGE'>('DESIGNER')
const chartElement=ref<HTMLElement|null>(null); let chart:echarts.ECharts|null=null
const money=(cents:number)=>`$${(Number(cents||0)/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`
const percent=(value:number)=>`${(Number(value||0)*100).toFixed(1)}%`
const correlation=(value:number|null)=>value==null?'样本不足':value.toFixed(2)
const metricRows=(metrics:LaunchSalesInsights['first7Days'])=>[
  {label:'直接购买',value:metrics.directOrders.toLocaleString()}, {label:'Bundle 归因',value:metrics.bundleOrders.toLocaleString()},
  {label:'净收入',value:money(metrics.netRevenueCents)}, {label:'退款金额',value:money(metrics.refundCents)},
  {label:'新品销售贡献率',value:percent(metrics.newProductContributionRate)},
  {label:'单品平均销量',value:metrics.averageOrders.toLocaleString()}, {label:'单品平均净收入',value:money(metrics.averageNetRevenueCents)},
]
const windows=computed(()=>data.value?[{label:'首发 7 天',metrics:metricRows(data.value.first7Days)},{label:'首发 30 天',metrics:metricRows(data.value.first30Days)}]:[])
const dimensionRows=computed(()=>data.value?.dimensions.find(item=>item.dimension===selectedDimension.value)?.groups??[])
const renderChart=async()=>{await nextTick();if(!chartElement.value||!data.value)return;chart ||= echarts.init(chartElement.value);const points=data.value.trend;const layout=buildBottomLineChartLayout();chart.setOption({tooltip:{trigger:'axis'},legend:{...layout.legend,data:['上线数量','后续 7 天销量','后续 30 天销量']},grid:{left:50,right:30,top:45,...layout.grid},xAxis:{type:'category',data:points.map(p=>p.period)},yAxis:[{type:'value',name:'上线数',min:layout.yAxisMin},{type:'value',name:'销量',min:layout.yAxisMin}],series:[{name:'上线数量',type:'bar',data:points.map(p=>p.launchCount),itemStyle:{color:'#72a88f'}},{name:'后续 7 天销量',type:'line',yAxisIndex:1,data:points.map(p=>p.orders7Days),smooth:true,lineStyle:{color:'#3278c8'}},{name:'后续 30 天销量',type:'line',yAxisIndex:1,data:points.map(p=>p.orders30Days),smooth:true,lineStyle:{color:'#d79221'}}]})}
const load=async()=>{loading.value=true;error.value='';try{data.value=(await getLaunchSalesInsights({from:filter.value.startDate,to:filter.value.endDate})).data?.data??null;await renderChart()}catch{error.value='上线销量分析暂时无法加载'}finally{loading.value=false}}
watch(filter,load,{deep:true,immediate:true});const resize=()=>chart?.resize();onMounted(()=>window.addEventListener('resize',resize));onBeforeUnmount(()=>{window.removeEventListener('resize',resize);chart?.dispose()})
</script>

<style scoped>
.analytics-section{margin-top:16px;padding:18px;border:1px solid #e2eae5;border-radius:12px;background:#fff}header,.subsection-heading{display:flex;align-items:end;justify-content:space-between;gap:12px}.kicker{color:#6f8177;font-size:10px;font-weight:800;letter-spacing:.14em}h2{margin:2px 0 0;color:#1d3027;font-size:18px}.period{color:#819087;font-size:12px}.headline-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}article{padding:14px;border:1px solid #e7ece9;border-radius:9px;background:#fbfcfb}article span{display:block;color:#718078;font-size:12px}article strong{display:block;margin-top:7px;color:#193126;font-size:20px}.window-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:12px}.window-card{padding:16px;border-radius:10px;background:#f5f9f7}.window-card h3{margin:0 0 10px;color:#244035;font-size:15px}.window-card dl{display:grid;grid-template-columns:1fr auto;gap:8px;margin:0;font-size:12px}.window-card dt{color:#718078}.window-card dd{margin:0;color:#20352b;font-weight:700}.subsection-heading{margin-top:24px}.correlation-grid{display:grid;grid-template-columns:repeat(2,1fr) minmax(240px,1.2fr);gap:10px;margin-top:10px}.correlation-grid p{margin:0;padding:14px;color:#7d8983;font-size:12px}.chart-scroll{overflow-x:auto}.chart{height:360px}.dimension-tabs{margin:12px 0}.dimension-tabs :deep(.el-radio-button__inner){min-width:90px}@media(max-width:800px){header{align-items:flex-start;flex-direction:column}.headline-grid{grid-template-columns:repeat(2,1fr)}.correlation-grid{grid-template-columns:1fr}.chart{min-width:720px}}@media(max-width:520px){.headline-grid,.window-grid{grid-template-columns:1fr}}
</style>
