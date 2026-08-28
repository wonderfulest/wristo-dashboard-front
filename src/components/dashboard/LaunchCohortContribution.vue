<template>
  <section class="analytics-section" v-loading="loading">
    <header><div><span>COHORT MIX</span><h2>首发、重新上线与存量贡献</h2></div><el-button size="small" @click="load">刷新</el-button></header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-alert v-else-if="response && !conserved" title="营收归因未守恒，请检查退款或 Bundle 数据" type="warning" :closable="false" show-icon />
    <ResponsiveTableShell v-if="rows.length">
      <template #table>
        <el-table :data="rows" size="small">
          <el-table-column label="分组" min-width="110"><template #default="{row}"><strong>{{ cohortLabel(row.cohortType) }}</strong></template></el-table-column>
          <el-table-column prop="appCount" label="应用数" width="90" />
          <el-table-column prop="downloads" label="下载量" width="100" />
          <el-table-column label="直接单品营收" min-width="130"><template #default="{row}">{{ formatUsdCents(row.directRevenueCents) }}</template></el-table-column>
          <el-table-column label="带动 Bundle 营收" min-width="150"><template #default="{row}">{{ formatUsdCents(row.bundleRevenueCents) }}</template></el-table-column>
          <el-table-column label="退款" width="100"><template #default="{row}">{{ formatUsdCents(row.refundCents) }}</template></el-table-column>
          <el-table-column label="归因总营收" min-width="120"><template #default="{row}"><strong>{{ formatUsdCents(row.attributedRevenueCents) }}</strong></template></el-table-column>
        </el-table>
      </template>
    </ResponsiveTableShell>
    <el-empty v-else-if="!loading && !error" description="暂无贡献数据" :image-size="72" />
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getLaunchContributions } from '@/api/launch-analytics'
import ResponsiveTableShell from '@/components/common/ResponsiveTableShell.vue'
import type { AnalyticsResponse, CohortContribution } from '@/types/launch-analytics'
import { contributionsAreConserved, formatUsdCents } from './launchAnalyticsUtils.mjs'
const loading=ref(false), error=ref('')
const response=ref<AnalyticsResponse<Record<string,CohortContribution>>|null>(null)
const order=['FIRST_LAUNCH','RELAUNCH','STOCK']
const rows=computed(() => order.map(key=>response.value?.data?.[key]).filter(Boolean) as CohortContribution[])
const conserved=computed(()=>contributionsAreConserved(response.value?.data))
const cohortLabel=(type:string)=>({FIRST_LAUNCH:'首发',RELAUNCH:'重新上线',STOCK:'存量'}[type]||type)
const load=async()=>{loading.value=true;error.value='';try{response.value=(await getLaunchContributions()).data??null}catch{error.value='贡献拆分暂时无法加载'}finally{loading.value=false}}
onMounted(load)
</script>
<style scoped>
.analytics-section{margin-top:16px;padding:18px;border:1px solid #e2eae5;border-radius:12px;background:#fff}header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}header span{color:#6f8177;font-size:10px;font-weight:800;letter-spacing:.14em}h2{margin:2px 0 0;color:#1d3027;font-size:18px}
</style>
