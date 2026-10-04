<template>
  <div class="usage-page">
    <div class="page-header"><div><h2>AI 用量与成本</h2><p>按用户和模型核对消耗，成本按调用时的价格版本估算。</p></div><el-button @click="$router.push('/ops/ai-prices')">模型官方定价</el-button></div>
    <el-alert title="预估成本按配置的最高单价计算，不应用缓存折扣、免费额度或阶梯优惠；不同币种分别汇总。缺少价格或计费用量的调用不计为零成本。" type="info" :closable="false" show-icon />
    <el-card shadow="never">
      <el-form inline @submit.prevent="search">
        <el-form-item label="日期"><el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px" /></el-form-item>
        <el-form-item label="用户"><UserSelect v-model="filters.userId" placeholder="搜索用户名或邮箱" style="width: 235px" /></el-form-item>
        <el-form-item label="服务商"><el-select v-model="filters.provider" clearable placeholder="全部" style="width: 130px"><el-option label="OpenAI" value="OPENAI" /><el-option label="百炼" value="BAILIAN" /></el-select></el-form-item>
        <el-form-item label="模型"><el-input v-model="filters.model" clearable placeholder="完整模型名称" style="width: 200px" /></el-form-item>
        <el-form-item label="场景"><el-select v-model="filters.scene" clearable placeholder="全部" style="width: 140px"><el-option v-for="(label,key) in scenes" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" native-type="submit" :loading="loading">查询</el-button><el-button :disabled="loading" @click="reset">重置</el-button></el-form-item>
      </el-form>
      <span class="muted">日期范围按北京时间（UTC+8），含结束日期。默认最近 30 天。</span>
    </el-card>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <section class="stats" v-loading="loading">
      <el-card shadow="never"><span>调用次数</span><strong>{{ count(overview?.totals.calls) }}</strong><small>失败 {{ count(overview?.totals.failed_calls) }} · 待完成 {{ count(overview?.totals.pending_calls) }}</small></el-card>
      <el-card shadow="never"><span>已知 Token</span><strong>{{ amount(overview?.totals.total_tokens) }}</strong><small>用量未知 {{ count(overview?.totals.unknown_token_calls) }} 次</small></el-card>
      <el-card shadow="never"><span>已知图片数量</span><strong>{{ amount(overview?.totals.image_count) }}</strong><small>图片与 Token 为独立计量项</small></el-card>
      <el-card shadow="never"><span>待估算调用</span><strong>{{ overview ? count((overview.totals.unpriced_calls || 0) + (overview.totals.unknown_cost_calls || 0)) : '—' }}</strong><small>缺少价格 {{ count(overview?.totals.unpriced_calls) }} · 缺少用量 {{ count(overview?.totals.unknown_cost_calls) }}</small></el-card>
    </section>
    <div class="costs"><el-card v-for="item in overview?.currencies || []" :key="item.cost_currency" shadow="never"><span>{{ item.cost_currency }} 预估成本（已估算部分）</span><strong>{{ money(item.estimated_cost) }}</strong><small>{{ item.priced_calls }} 次调用</small></el-card><p v-if="overview && !overview.currencies.length" class="muted">当前筛选范围暂无可估算的成本。</p></div>
    <el-card shadow="never">
      <el-tabs v-model="group" @tab-change="changeGroup"><el-tab-pane label="用户排行" name="users" /><el-tab-pane label="模型汇总" name="models" /><el-tab-pane label="调用明细" name="calls" /></el-tabs>
      <el-table :data="rows" v-loading="loading" empty-text="当前条件下暂无调用记录" :row-key="rowKey">
        <el-table-column v-if="group !== 'models'" label="用户" min-width="210"><template #default="{row}"><strong>{{ row.username || row.user_id }}</strong><div class="muted">{{ row.email || `ID: ${row.user_id}` }}</div></template></el-table-column>
        <el-table-column v-if="group !== 'users'" label="模型" min-width="200"><template #default="{row}">{{ row.model }}<div class="muted">{{ row.provider }}</div></template></el-table-column>
        <el-table-column v-if="group !== 'calls'" prop="calls" label="调用次数" width="95" />
        <el-table-column v-if="group === 'calls'" label="场景 / 状态" min-width="145"><template #default="{row}">{{ scenes[row.scene] || row.scene }}<div><el-tag :type="row.status === 'SUCCEEDED' ? 'success' : row.status === 'FAILED' ? 'danger' : 'info'">{{ statuses[row.status] || row.status }}</el-tag></div></template></el-table-column>
        <el-table-column label="输入 Token" min-width="120"><template #default="{row}">{{ amount(row.input_tokens) }}</template></el-table-column>
        <el-table-column label="其中缓存" min-width="110"><template #default="{row}">{{ amount(row.cached_input_tokens) }}</template></el-table-column>
        <el-table-column label="输出 Token" min-width="120"><template #default="{row}">{{ amount(row.output_tokens) }}</template></el-table-column>
        <el-table-column label="总 Token" min-width="125"><template #default="{row}">{{ amount(row.total_tokens) }}</template></el-table-column>
        <el-table-column label="图片" width="90"><template #default="{row}">{{ amount(row.image_count) }}</template></el-table-column>
        <el-table-column label="预估成本" min-width="180"><template #default="{row}"><strong>{{ row.estimated_cost == null ? '—' : `${row.cost_currency} ${money(row.estimated_cost)}` }}</strong><div class="muted" v-if="group === 'calls'">{{ costStatuses[row.cost_status] || '未估算' }}</div><div class="muted" v-else>未定价 {{ row.unpriced_calls || 0 }} · 缺用量 {{ row.unknown_cost_calls || 0 }}</div></template></el-table-column>
        <el-table-column v-if="group === 'calls'" label="时间 / 价格版本" min-width="210"><template #default="{row}">{{ time(row.created_at) }}<div><el-button v-if="row.pricing_version" link type="primary" @click="$router.push({path:'/ops/ai-prices', query:{version:row.pricing_version}})">查看价格版本</el-button><span v-else class="muted">未关联价格</span></div><el-tooltip :content="row.request_id"><span class="muted">请求 {{ row.request_id?.slice(0,8) }}</span></el-tooltip></template></el-table-column>
        <el-table-column v-if="group === 'users'" label="操作" width="95" fixed="right"><template #default="{row}"><el-button link type="primary" @click="userDetails(row.user_id)">调用明细</el-button></template></el-table-column>
      </el-table>
      <div class="pagination"><span class="muted">同一用户或模型的不同币种分别列行，未知用量显示“—”。</span><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[20,50,100]" :total="total" layout="total, sizes, prev, pager, next" @current-change="load" @size-change="search" /></div>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import UserSelect from '@/components/users/UserSelect.vue'
import { getUsageOverview, getUsageReport, type UsageFilter, type UsageOverview, type UsageRow } from '@/api/aiUsage'
const filters = reactive<UsageFilter>({})
const dates = ref<string[]>([])
const group = ref('users'), page = ref(1), pageSize = ref(20), total = ref(0)
const loading = ref(false), error = ref(''), overview = ref<UsageOverview>(), rows = ref<UsageRow[]>([])
const scenes: Record<string,string> = { AI_TAGS:'应用标签', AI_DESCRIPTION:'AI 描述', AI_BANNER:'Banner 图片', AI_MARKETING:'营销文案' }
const statuses: Record<string,string> = { SUCCEEDED:'成功', FAILED:'失败', STARTED:'待完成' }
const costStatuses: Record<string,string> = { ESTIMATED:'已估算', UNPRICED:'未配置价格', UNKNOWN_USAGE:'缺少计费用量' }
const amount = (v?: number | null) => v == null ? '—' : Number(v).toLocaleString('zh-CN')
const count = (v?: number) => v == null ? '—' : Number(v).toLocaleString('zh-CN')
const money = (v: number) => Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 6, maximumFractionDigits: 10 })
const time = (v?: string) => v ? new Date(v).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}) : '—'
const rowKey = (r: UsageRow) => r.id || `${r.user_id || `${r.provider}/${r.model}`}/${r.cost_currency || 'unknown'}`
let sequence = 0
let applied: UsageFilter = {}
async function load() {
  const request = ++sequence; loading.value = true; error.value = ''; rows.value = []; overview.value = undefined; total.value = 0
  try {
    const [summary,result] = await Promise.all([getUsageOverview(applied),getUsageReport({...applied,group:group.value,page:page.value,pageSize:pageSize.value})])
    if(request !== sequence) return
    if(summary.code !== 0 || result.code !== 0 || !summary.data || !result.data) throw new Error()
    overview.value = summary.data; rows.value = result.data.items; total.value = result.data.total
  } catch { if(request === sequence) error.value = '无法读取 AI 用量，请重新查询。' }
  finally { if(request === sequence) loading.value = false }
}
function search() { page.value = 1; applied = {...filters,model:filters.model?.trim(),from:dates.value?.[0],to:dates.value?.[1]}; void load() }
function changeGroup() { page.value = 1; void load() }
function userDetails(id: string) { filters.userId = Number(id); group.value = 'calls'; search() }
function reset() {
  Object.keys(filters).forEach(k => delete filters[k as keyof UsageFilter])
  const end = new Date(), start = new Date(end.getTime() - 29*86400000)
  const day = (d: Date) => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)
  dates.value = [day(start),day(end)]; search()
}
onMounted(reset)
</script>
<style scoped>
.usage-page{padding:24px;display:flex;flex-direction:column;gap:20px}.page-header,.pagination{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}h2{margin:0 0 8px}p,.muted,small{color:var(--el-text-color-secondary);font-size:12px;line-height:1.7}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.stats strong,.costs strong{display:block;font-size:26px;margin:12px 0}.stats span,.costs span{font-size:13px}.costs{display:flex;flex-wrap:wrap;gap:16px}.costs .el-card{min-width:260px}.pagination{margin-top:20px}@media(max-width:1000px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.usage-page{padding:12px}.stats{grid-template-columns:1fr}.pagination{overflow:auto}.usage-page :deep(.el-form-item){display:flex;width:100%;margin-right:0}.usage-page :deep(.el-form-item__label){width:64px!important;flex:0 0 64px;justify-content:flex-start;text-align:left}.usage-page :deep(.el-form-item__content){flex:1;min-width:0}.usage-page :deep(.el-form-item__content > .el-select),.usage-page :deep(.el-form-item__content > .el-input),.usage-page :deep(.el-form-item__content > .el-date-editor){width:100%!important;min-width:0}}
</style>
