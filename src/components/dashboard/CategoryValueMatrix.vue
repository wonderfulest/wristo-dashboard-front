<template>
  <section class="analytics-section" v-loading="loading">
    <header><div><span>CATALOG VALUE</span><h2>品类价值矩阵</h2></div><el-button size="small" @click="load">刷新</el-button></header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <ResponsiveTableShell v-if="rows.length">
      <template #table><el-table :data="rows" size="small" :default-sort="{prop:'totalRevenueCents',order:'descending'}">
        <el-table-column prop="categoryName" label="品类" min-width="120" sortable />
        <el-table-column label="象限" min-width="145"><template #default="{row}"><el-tag :type="tone(row.quadrant)">{{ quadrantLabel(row.quadrant) }}</el-tag></template></el-table-column>
        <el-table-column prop="totalRevenueCents" label="规模营收" min-width="120" sortable><template #default="{row}">{{ formatUsdCents(row.totalRevenueCents) }}</template></el-table-column>
        <el-table-column prop="efficiencyRevenueCents" label="单款效率" min-width="110" sortable><template #default="{row}">{{ formatUsdCents(row.efficiencyRevenueCents) }}</template></el-table-column>
        <el-table-column label="爆款率" width="100"><template #default="{row}">{{ percent(row.blockbusterRate) }}</template></el-table-column>
        <el-table-column label="首发成功率" width="110"><template #default="{row}">{{ percent(row.firstLaunchSuccessRate) }}</template></el-table-column>
        <el-table-column label="稳定性" width="90"><template #default="{row}">{{ percent(row.stabilityScore) }}</template></el-table-column>
        <el-table-column label="样本" width="120"><template #default="{row}"><span v-if="row.ratingStatus==='SAMPLE_INSUFFICIENT'" class="warning">样本不足</span><span v-else>{{ row.productCount }} 款 / {{ row.maturedProductCount }} 款成熟</span></template></el-table-column>
      </el-table></template>
    </ResponsiveTableShell>
    <el-empty v-else-if="!loading&&!error" description="暂无品类价值数据" :image-size="72" />
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getCategoryValues } from '@/api/launch-analytics'
import ResponsiveTableShell from '@/components/common/ResponsiveTableShell.vue'
import type { CategoryValue,ValueQuadrant } from '@/types/launch-analytics'
import { formatUsdCents,quadrantLabel } from './launchAnalyticsUtils.mjs'
const loading=ref(false),error=ref(''),rows=ref<CategoryValue[]>([])
const percent=(v:number)=>`${(v*100).toFixed(1)}%`
const tone=(q:ValueQuadrant)=>q==='STAR'?'success':q==='LOW_VALUE'?'danger':q==='NICHE'?'warning':'info'
const load=async()=>{loading.value=true;error.value='';try{rows.value=(await getCategoryValues()).data?.data??[]}catch{error.value='品类价值数据暂时无法加载'}finally{loading.value=false}}
onMounted(load)
</script>
<style scoped>
.analytics-section{margin-top:16px;padding:18px;border:1px solid #e2eae5;border-radius:12px;background:#fff}header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}header span{color:#6f8177;font-size:10px;font-weight:800;letter-spacing:.14em}h2{margin:2px 0 0;color:#1d3027;font-size:18px}.warning{color:#b06b00;font-weight:700}
</style>
