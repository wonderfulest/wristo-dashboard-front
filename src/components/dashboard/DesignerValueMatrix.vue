<template>
  <section class="analytics-section" v-loading="loading">
    <header><div><span>DESIGNER VALUE</span><h2>设计师价值排名</h2></div><el-button size="small" @click="load">刷新</el-button></header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <ResponsiveTableShell v-if="pagedRows.length">
      <template #table><el-table :data="pagedRows" size="small">
        <el-table-column prop="designerName" label="设计师" min-width="120" />
        <el-table-column label="象限" min-width="145"><template #default="{row}">{{ quadrantLabel(row.quadrant) }}</template></el-table-column>
        <el-table-column label="规模营收" min-width="115"><template #default="{row}">{{ formatUsdCents(row.totalRevenueCents) }}</template></el-table-column>
        <el-table-column label="单款效率" min-width="105"><template #default="{row}">{{ formatUsdCents(row.efficiencyRevenueCents) }}</template></el-table-column>
        <el-table-column label="爆款率" width="90"><template #default="{row}">{{ percent(row.blockbusterRate) }}</template></el-table-column>
        <el-table-column label="首发成功率" width="110"><template #default="{row}">{{ percent(row.firstLaunchSuccessRate) }}</template></el-table-column>
        <el-table-column label="稳定性" width="90"><template #default="{row}">{{ percent(row.stabilityScore) }}</template></el-table-column>
        <el-table-column label="供稿样本" min-width="140"><template #default="{row}"><span v-if="row.ratingStatus==='SAMPLE_INSUFFICIENT'" class="warning">样本不足：{{ row.productCount }} 款 / {{ row.maturedProductCount }} 款成熟</span><span v-else>{{ row.productCount }} 款 / {{ row.maturedProductCount }} 款成熟</span></template></el-table-column>
      </el-table></template>
    </ResponsiveTableShell>
    <el-pagination v-if="rows.length>pageSize" v-model:current-page="page" :page-size="pageSize" :total="rows.length" layout="prev, pager, next" small />
    <el-empty v-else-if="!loading&&!error&&!rows.length" description="暂无设计师价值数据" :image-size="72" />
  </section>
</template>
<script setup lang="ts">
import { computed,onMounted,ref } from 'vue'
import { getDesignerValues } from '@/api/launch-analytics'
import ResponsiveTableShell from '@/components/common/ResponsiveTableShell.vue'
import type { DesignerValue } from '@/types/launch-analytics'
import { formatUsdCents,quadrantLabel } from './launchAnalyticsUtils.mjs'
const loading=ref(false),error=ref(''),rows=ref<DesignerValue[]>([]),page=ref(1),pageSize=10
const pagedRows=computed(()=>rows.value.slice((page.value-1)*pageSize,page.value*pageSize))
const percent=(v:number)=>`${(v*100).toFixed(1)}%`
const load=async()=>{loading.value=true;error.value='';try{rows.value=((await getDesignerValues()).data?.data??[]).sort((a,b)=>b.totalRevenueCents-a.totalRevenueCents);page.value=1}catch{error.value='设计师价值数据暂时无法加载'}finally{loading.value=false}}
onMounted(load)
</script>
<style scoped>
.analytics-section{margin-top:16px;padding:18px;border:1px solid #e2eae5;border-radius:12px;background:#fff}header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}header span{color:#6f8177;font-size:10px;font-weight:800;letter-spacing:.14em}h2{margin:2px 0 0;color:#1d3027;font-size:18px}.warning{color:#b06b00;font-weight:700}.el-pagination{justify-content:flex-end;margin-top:12px}
</style>
