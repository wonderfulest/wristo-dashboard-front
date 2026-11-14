<template>
  <div class="usage-page">
    <header class="page-header">
      <div><h2>用量与成本</h2><p>核对 AI 调用和供应商预估成本，用户 AI 点数独立记账。</p></div>
      <div class="actions"><el-button @click="openAccount(filters.userId)">用户账户</el-button><el-button @click="$router.push('/ops/ai-prices')">成本价格</el-button></div>
    </header>
    <el-card shadow="never" class="filter-card">
      <el-form inline @submit.prevent="search">
        <el-form-item label="日期"><el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" :clearable="false" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
        <el-form-item label="用户"><UserSelect v-model="filters.userId" placeholder="搜索用户名或邮箱" class="user-filter" /></el-form-item>
        <el-form-item><el-button type="primary" native-type="submit" :loading="loading">查询</el-button><el-button :disabled="loading" @click="reset">重置</el-button><el-button link type="primary" :aria-expanded="moreFilters" @click="moreFilters = !moreFilters">{{ moreFilters ? '收起筛选' : '更多筛选' }}</el-button></el-form-item>
        <div v-show="moreFilters" class="advanced-filters">
          <el-form-item label="服务商"><el-select v-model="filters.provider" clearable placeholder="全部" class="provider-filter"><el-option label="OpenAI" value="OPENAI" /><el-option label="百炼" value="BAILIAN" /></el-select></el-form-item>
          <el-form-item label="模型"><el-select v-model="filters.model" filterable allow-create default-first-option clearable placeholder="搜索或输入完整模型名" class="model-filter"><el-option v-for="model in availableModels" :key="model" :label="model" :value="model" /></el-select></el-form-item>
          <el-form-item label="场景"><el-select v-model="filters.scene" clearable placeholder="全部" class="scene-filter"><el-option v-for="(label,key) in scenes" :key="key" :label="label" :value="key" /></el-select></el-form-item>
          <p v-if="modelError" class="muted">{{ modelError }}</p>
        </div>
      </el-form>
      <div class="filter-footer"><div class="quick-dates"><el-button size="small" @click="quickRange(1)">今天</el-button><el-button size="small" @click="quickRange(7)">近 7 天</el-button><el-button size="small" @click="quickRange(30)">近 30 天</el-button></div><span class="muted">北京时间（UTC+8），含结束日期。</span></div>
      <p v-if="rangeError" class="range-error" role="alert">{{ rangeError }}</p>
    </el-card>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <section class="stats" v-loading="loading">
      <el-card shadow="never"><span>调用次数</span><strong>{{ count(overview?.totals.calls) }}</strong><small>失败 {{ count(overview?.totals.failed_calls) }} · 待完成 {{ count(overview?.totals.pending_calls) }}</small></el-card>
      <el-card shadow="never"><span>已知 Token</span><strong>{{ amount(overview?.totals.total_tokens) }}</strong><small>用量未知 {{ count(overview?.totals.unknown_token_calls) }} 次</small></el-card>
      <el-card shadow="never"><span>已知图片数量</span><strong>{{ amount(overview?.totals.image_count) }}</strong><small>图片与 Token 为独立计量项</small></el-card>
      <el-card shadow="never"><span>待估算调用</span><strong>{{ overview ? count((overview.totals.unpriced_calls || 0) + (overview.totals.unknown_cost_calls || 0)) : '—' }}</strong><small>缺少价格 {{ count(overview?.totals.unpriced_calls) }} · 缺少用量 {{ count(overview?.totals.unknown_cost_calls) }}</small></el-card>
    </section>
    <div class="costs"><el-card v-for="item in overview?.currencies || []" :key="item.cost_currency" shadow="never"><span>{{ item.cost_currency }} 预估成本（已估算部分）</span><strong><el-tooltip :content="money(item.estimated_cost)"><span>{{ summaryMoney(item.estimated_cost) }}</span></el-tooltip></strong><small>{{ item.priced_calls }} 次调用</small></el-card><p v-if="overview && !overview.currencies.length" class="muted">当前筛选范围暂无可估算的成本。</p></div>
    <details class="methodology"><summary>统计口径与成本说明</summary><p>预估成本按调用时配置的最高单价计算，不应用缓存折扣、免费额度或阶梯优惠，不代表供应商实际账单。不同币种分别汇总；缺少价格或计费用量的调用不计为零成本。图片与 Token 独立展示，费用按模型的计费方式计算。金额摘要保留四位小数，悬停和明细可查看完整精度。</p></details>
    <el-card shadow="never" class="report-card">
      <div class="report-heading"><strong>用量明细</strong><span class="muted">{{ applied.from }} 至 {{ applied.to }}</span></div>
      <el-tabs v-model="group" @tab-change="changeGroup"><el-tab-pane label="用户排行" name="users" /><el-tab-pane label="模型汇总" name="models" /><el-tab-pane label="调用明细" name="calls" /></el-tabs>
      <el-table :data="rows" v-loading="loading" :empty-text="error ? '读取失败，请重新查询' : '当前条件下暂无调用记录'" :row-key="rowKey">
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
        <el-table-column v-if="group === 'users'" label="操作" width="180" fixed="right"><template #default="{row}"><el-button link type="primary" @click="userDetails(row.user_id)">调用明细</el-button><el-button link type="primary" @click="openAccount(Number(row.user_id))">用户账户</el-button></template></el-table-column>
      </el-table>
      <div class="pagination"><span class="muted">同一用户或模型的不同币种分别列行，未知用量显示“—”。</span><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[20,50,100]" :total="total" layout="total, sizes, prev, pager, next" @current-change="commitQuery" @size-change="changeGroup" /></div>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserSelect from '@/components/users/UserSelect.vue'
import { getUsageOverview, getUsageReport, getAiPrices, type UsageFilter, type UsageOverview, type UsageRow, type PriceVersion } from '@/api/aiUsage'

const route = useRoute(), router = useRouter()
const filters = reactive<UsageFilter>({})
const dates = ref<string[]>([]), moreFilters = ref(false), rangeError = ref('')
const prices = ref<PriceVersion[]>([]), modelError = ref('')
const availableModels = computed(() => [...new Set(prices.value.filter(p => !filters.provider || p.provider === filters.provider).map(p => p.model))].sort())
const group = ref('users'), page = ref(1), pageSize = ref(20), total = ref(0)
const loading = ref(false), error = ref(''), overview = ref<UsageOverview>(), rows = ref<UsageRow[]>([])
const applied = ref<UsageFilter>({})
const scenes: Record<string,string> = { AI_WATCHFACE:'可编辑表盘', AI_WATCHFACE_ADJUST:'表盘局部调整', AI_TAGS:'应用标签', AI_DESCRIPTION:'AI 描述', AI_BANNER:'Banner 图片', AI_MARKETING:'营销文案' }
const statuses: Record<string,string> = { SUCCEEDED:'成功', FAILED:'失败', STARTED:'待完成' }
const costStatuses: Record<string,string> = { ESTIMATED:'已估算', UNPRICED:'未配置价格', UNKNOWN_USAGE:'缺少计费用量' }
const amount = (v?: number | null) => v == null ? '—' : Number(v).toLocaleString('zh-CN')
const count = amount
const money = (v: number) => Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 6, maximumFractionDigits: 10 })
const summaryMoney = (v: number) => Number(v) > 0 && Number(v) < 0.0001 ? '< 0.0001' : Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
const time = (v?: string) => v ? new Date(v).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}) : '—'
const rowKey = (r: UsageRow) => r.id || `${r.user_id || `${r.provider}/${r.model}`}/${r.cost_currency || 'unknown'}`
const day = (date: Date) => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)
function dateRange(days: number) { const now = new Date(); return [day(new Date(now.getTime() - (days - 1) * 86400000)), day(now)] }
const queryString = (key: string) => typeof route.query[key] === 'string' ? route.query[key] as string : ''
let sequence = 0
async function load() {
  const request = ++sequence; loading.value = true; error.value = ''; rows.value = []; overview.value = undefined; total.value = 0
  try {
    const [summary,result] = await Promise.all([getUsageOverview(applied.value),getUsageReport({...applied.value,group:group.value,page:page.value,pageSize:pageSize.value})])
    if(request !== sequence) return
    if(summary.code !== 0 || result.code !== 0 || !summary.data || !result.data) throw new Error()
    overview.value = summary.data; rows.value = result.data.items; total.value = result.data.total
  } catch { if(request === sequence) error.value = '无法读取 AI 用量，请重新查询。' }
  finally { if(request === sequence) loading.value = false }
}
function validDates() {
  const [from, to] = dates.value || []
  const valid = (value?: string) => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
  rangeError.value = !valid(from) || !valid(to) || from > to ? '请选择有效的开始和结束日期。' : ''
  return !rangeError.value
}
function readQuery() {
  const id = Number(queryString('userId'))
  Object.assign(filters, {userId: Number.isSafeInteger(id) && id > 0 ? id : undefined, provider: queryString('provider') || undefined, model: queryString('model') || undefined, scene: queryString('scene') || undefined})
  dates.value = queryString('from') && queryString('to') ? [queryString('from'), queryString('to')] : dateRange(30)
  group.value = ['users','models','calls'].includes(queryString('group')) ? queryString('group') : 'users'
  const requestedPage = Number(queryString('page'))
  page.value = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  pageSize.value = [20,50,100].includes(Number(queryString('pageSize'))) ? Number(queryString('pageSize')) : 20
  moreFilters.value = !!(filters.provider || filters.model || filters.scene)
  if (!validDates()) { ++sequence; loading.value = false; overview.value = undefined; rows.value = []; total.value = 0; return }
  applied.value = {...filters, from:dates.value[0], to:dates.value[1]}
  void load()
}
function commitQuery() {
  const query: Record<string,string> = {group:group.value, page:String(page.value), pageSize:String(pageSize.value)}
  for (const [key, value] of Object.entries(applied.value)) if (value != null && value !== '') query[key] = String(value)
  const target = router.resolve({path:route.path, query})
  if (target.fullPath === route.fullPath) void load()
  else void router.replace({path:route.path, query})
}
function search() {
  if (!validDates()) return
  page.value = 1
  applied.value = {...filters, model:filters.model?.trim(), from:dates.value[0], to:dates.value[1]}
  commitQuery()
}
function changeGroup() { page.value = 1; commitQuery() }
function userDetails(id: string) { filters.userId = Number(id); group.value = 'calls'; search() }
function openAccount(id?: number) { void router.push({path:'/ops/points-accounts', query:id ? {userId:String(id)} : {}}) }
function quickRange(days: number) { dates.value = dateRange(days); search() }
function reset() { Object.keys(filters).forEach(k => delete filters[k as keyof UsageFilter]); dates.value = dateRange(30); moreFilters.value = false; search() }
watch(() => route.fullPath, () => { if (route.path === '/ops/ai-usage') readQuery() }, {immediate:true})
onMounted(async () => {
  try { const result = await getAiPrices(); if (result.code !== 0 || !result.data) throw new Error(); prices.value = result.data }
  catch { modelError.value = '模型候选暂不可用，仍可输入完整模型名称查询。' }
})
onUnmounted(() => { sequence++ })
</script>
<style scoped>
.usage-page { padding: 20px; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.page-header, .pagination, .actions, .filter-footer, .report-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.actions { justify-content: flex-end; } .actions .el-button + .el-button { margin-left: 0; }
h2 { margin: 0 0 4px; font-size: 22px; } p { margin: 4px 0; }
p, .muted, small { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.7; }
.filter-card :deep(.el-card__body), .report-card :deep(.el-card__body) { padding: 16px; }
.filter-card :deep(.el-form-item) { margin-bottom: 12px; margin-right: 20px; }
.filter-card :deep(.el-date-editor) { width: 260px; }
.user-filter { width: 220px; } .provider-filter, .scene-filter { width: 160px; } .model-filter { width: 260px; }
.advanced-filters { border-top: 1px solid var(--el-border-color-lighter); padding-top: 12px; }
.filter-footer { justify-content: flex-start; } .quick-dates { display: flex; gap: 8px; } .quick-dates .el-button + .el-button { margin-left: 0; }
.stats { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 12px; }
.stats :deep(.el-card__body) { padding: 16px; } .stats strong { display: block; font-size: 25px; margin: 8px 0; overflow-wrap: anywhere; }
.stats span { font-size: 13px; }
.costs { display: flex; flex-wrap: wrap; gap: 12px; }
.costs .el-card { flex: 1 1 260px; min-width: 0; }
.costs :deep(.el-card__body) { padding: 14px 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 20px; }
.costs strong { font-size: 22px; font-variant-numeric: tabular-nums; } .costs small { margin-left: auto; }
.methodology { border: 1px solid var(--el-border-color-lighter); border-radius: 4px; padding: 10px 14px; }
.methodology summary { cursor: pointer; font-size: 12px; color: var(--el-text-color-secondary); }
.methodology p { margin-top: 8px; }
.report-heading { margin-bottom: 4px; } .pagination { margin-top: 16px; } .range-error { color: var(--el-color-danger); }
@media(max-width:1100px) { .stats { grid-template-columns: repeat(2,minmax(0,1fr)); } }
@media(max-width:600px) {
  .usage-page { padding: 12px; } .stats { gap: 8px; } .stats strong { font-size: 21px; }
  .pagination { overflow: auto; } .usage-page :deep(.el-form-item) { display: flex; width: 100%; margin-right: 0; }
  .usage-page :deep(.el-form-item__label) { width: 52px !important; flex: 0 0 52px; justify-content: flex-start; text-align: left; }
  .usage-page :deep(.el-form-item__content) { flex: 1; min-width: 0; }
  .usage-page :deep(.el-form-item__content > .el-select), .usage-page :deep(.el-form-item__content > .el-input), .usage-page :deep(.el-form-item__content > .el-date-editor) { width: 100% !important; min-width: 0; }
}
</style>
