<template>
  <section class="analytics-section" v-loading="loading">
    <header><div><span>MARGINAL RETURN</span><h2>上线数量与边际营收</h2></div><el-button size="small" @click="load">刷新</el-button></header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <div v-if="data" class="metric-grid">
      <article><span>推荐区间</span><strong>{{ recommendationRangeLabel(data) }}</strong></article>
      <article><span>边际营收</span><strong :class="{negative:data.marginalRevenuePerLaunchCents<0}">{{ formatUsdCents(data.marginalRevenuePerLaunchCents) }}</strong></article>
      <article><span>存量单款保留</span><strong>{{ percent(data.stockRevenueRetention) }}</strong></article>
      <article><span>新品单款保留</span><strong>{{ percent(data.launchRevenueRetention) }}</strong></article>
    </div>
    <p class="note">历史关联推荐：推荐区间要求预测营收达到历史最高值的 95%，边际营收为正，且存量与新品单款营收下降不超过 10%。</p>
    <el-empty v-if="!loading&&!data" description="证据不足，暂不生成上线量建议" :image-size="72" />
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getLaunchMarginalRevenue } from '@/api/launch-analytics'
import type { LaunchRecommendation } from '@/types/launch-analytics'
import { formatUsdCents,recommendationRangeLabel } from './launchAnalyticsUtils.mjs'
const loading=ref(false),error=ref(''),data=ref<LaunchRecommendation|null>(null)
const percent=(v:number)=>`${(v*100).toFixed(1)}%`
const load=async()=>{loading.value=true;error.value='';try{data.value=(await getLaunchMarginalRevenue()).data?.data??null}catch{error.value='边际营收数据暂时无法加载'}finally{loading.value=false}}
onMounted(load)
</script>
<style scoped>
.analytics-section{margin-top:16px;padding:18px;border:1px solid #e2eae5;border-radius:12px;background:#fff}header{display:flex;align-items:center;justify-content:space-between;gap:12px}header span{color:#6f8177;font-size:10px;font-weight:800;letter-spacing:.14em}h2{margin:2px 0 0;color:#1d3027;font-size:18px}.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}article{padding:14px;border:1px solid #e7ece9;border-radius:9px;background:#fbfcfb}article span{display:block;color:#718078;font-size:12px}article strong{display:block;margin-top:7px;color:#193126;font-size:19px}.negative{color:#c33!important}.note{color:#7b8881;font-size:12px;line-height:1.6}@media(max-width:700px){.metric-grid{grid-template-columns:repeat(2,1fr)}}
</style>
