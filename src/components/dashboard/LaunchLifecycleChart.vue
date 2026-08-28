<template>
  <section class="analytics-section" v-loading="loading">
    <header><div><span>LIFECYCLE</span><h2>应用生命周期曲线</h2></div><el-button size="small" @click="load">刷新</el-button></header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <div v-if="curve" class="milestones">
      <div><span>样本量</span><strong>{{ curve.sampleSize }}</strong></div><div><span>峰值</span><strong>{{ ageLabel(curve.peakAgeDays) }}</strong></div>
      <div><span>半衰期</span><strong>{{ ageLabel(curve.halfLifeAgeDays) }}</strong></div><div><span>进入长尾</span><strong>{{ ageLabel(curve.longTailAgeDays) }}</strong></div>
    </div>
    <div class="chart-scroll" role="region" aria-label="生命周期图表可横向滚动" tabindex="0">
      <div ref="chartElement" class="chart" role="img" aria-label="应用生命周期曲线"></div>
    </div>
    <el-empty v-if="!loading && !curve" description="样本不足，暂时无法生成生命周期曲线" :image-size="72" />
  </section>
</template>
<script setup lang="ts">
import * as echarts from 'echarts'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { getLaunchLifecycle } from '@/api/launch-analytics'
import type { LifecycleCurve } from '@/types/launch-analytics'
const loading=ref(false),error=ref(''),curve=ref<LifecycleCurve|null>(null),chartElement=ref<HTMLElement|null>(null)
let chart:echarts.ECharts|null=null
const ageLabel=(value:number|null)=>value==null?'未识别':`第 ${value} 天`
const render=async()=>{await nextTick();if(!chartElement.value||!curve.value)return;chart ||= echarts.init(chartElement.value);const points=curve.value.points;chart.setOption({tooltip:{trigger:'axis'},legend:{data:['P25 下载','P50 下载','P75 下载','P50 营收']},grid:{left:50,right:55,top:42,bottom:38},xAxis:{type:'category',name:'上线日龄',data:points.map(p=>p.ageDays)},yAxis:[{type:'value',name:'下载量'},{type:'value',name:'营收($)',axisLabel:{formatter:(v:number)=>`$${v}`}}],series:[{name:'P25 下载',type:'line',symbol:'none',data:points.map(p=>p.p25Downloads),lineStyle:{color:'#aacfc0',type:'dashed'}},{name:'P50 下载',type:'line',symbol:'none',data:points.map(p=>p.p50Downloads),lineStyle:{color:'#16845a',width:3}},{name:'P75 下载',type:'line',symbol:'none',data:points.map(p=>p.p75Downloads),lineStyle:{color:'#75aa96',type:'dashed'}},{name:'P50 营收',type:'line',yAxisIndex:1,symbol:'none',data:points.map(p=>p.p50RevenueCents/100),lineStyle:{color:'#d18a22'}}]})}
const load=async()=>{loading.value=true;error.value='';try{const data=(await getLaunchLifecycle()).data?.data;curve.value=data?.status==='READY'?data:null;await render()}catch{error.value='生命周期数据暂时无法加载'}finally{loading.value=false}}
const resize=()=>chart?.resize();onMounted(()=>{load();window.addEventListener('resize',resize)});onBeforeUnmount(()=>{window.removeEventListener('resize',resize);chart?.dispose()})
</script>
<style scoped>
.analytics-section{margin-top:16px;padding:18px;border:1px solid #e2eae5;border-radius:12px;background:#fff}header{display:flex;align-items:center;justify-content:space-between;gap:12px}header span,.milestones span{color:#6f8177;font-size:10px;font-weight:800;letter-spacing:.12em}h2{margin:2px 0 0;color:#1d3027;font-size:18px}.milestones{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.milestones div{padding:10px;border-radius:8px;background:#f5f8f6}.milestones strong{display:block;margin-top:5px;color:#20372c}.chart-scroll{overflow-x:auto}.chart{width:100%;height:360px}@media(max-width:600px){.milestones{grid-template-columns:repeat(2,1fr)}.chart{min-width:680px}}
</style>
