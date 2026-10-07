<template>
  <div class="user-overview">
    <header class="page-header">
      <div><h2>用户统计</h2><p>了解用户增长、注册入口与账号情况。</p></div>
      <el-button @click="router.push('/users/user-management')">用户管理</el-button>
    </header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <section v-loading="loading" aria-label="全平台用户概览">
      <div class="section-heading"><h3>基础用户概览</h3><span class="muted">{{ updatedAt }}</span></div>
      <div class="stats-grid">
        <button v-for="(label, index) in metricLabels" :key="label" type="button" class="stat-card"
          :disabled="!report || loading" @click="selectMetric(index)">
          <span>{{ label }}</span><strong>{{ report ? report.metrics[index].count.toLocaleString('zh-CN') : '—' }}</strong>
          <small>查看用户 →</small>
        </button>
      </div>
      <p class="muted">排除已删除账号，包含禁用账号及系统建号。近 7/30 天按北京时间、含今天计算；登录人数依据最后登录时间，不代表活跃用户。以下日期筛选仅影响增长趋势。</p>
    </section>
    <el-card shadow="never">
      <div class="section-heading"><h3>用户增长趋势</h3><span v-if="report" class="muted">{{ report.from }} 至 {{ report.to }} · {{ sourceLabel(report.source || '') || '全部入口' }} · 新增 {{ periodTotal.toLocaleString('zh-CN') }} 人</span></div>
      <el-form inline @submit.prevent="search">
        <el-form-item label="日期范围"><el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" :clearable="false" :disabled-date="disabledDate" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
        <el-form-item label="粒度"><el-select v-model="granularity" style="width: 100px" aria-label="统计粒度"><el-option label="按日" value="day" /><el-option label="按周" value="week" /><el-option label="按月" value="month" /></el-select></el-form-item>
        <el-form-item label="注册入口"><el-select v-model="source" clearable placeholder="全部入口" style="width: 175px" aria-label="趋势注册入口"><el-option v-for="item in sourceOptions" :key="item.key" :label="sourceLabel(item.key)" :value="item.key" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" native-type="submit" :loading="loading">查询</el-button><el-button :disabled="loading" @click="reset">最近 30 天</el-button></el-form-item>
      </el-form>
      <p v-if="rangeError" class="range-error" role="alert">{{ rangeError }}</p>
      <p class="muted">北京时间，含结束日期，最多 366 天；周一为每周起点。首尾周/月仅包含所选日期，今天截至查询时刻。历史新增仅计当前未删除账号。</p>
      <div v-loading="loading">
        <template v-if="report">
          <UserGrowthChart :rows="report.trend" />
          <el-table :data="trendRows" row-key="from" max-height="350" empty-text="暂无数据">
            <el-table-column label="统计期间" min-width="180"><template #default="{ row }">{{ row.from === row.to ? row.from : `${row.from} 至 ${row.to}` }}</template></el-table-column>
            <el-table-column label="新增用户" min-width="100" align="right"><template #default="{ row }"><el-button link type="primary" @click="openTrend(row)">{{ row.count.toLocaleString('zh-CN') }}</el-button></template></el-table-column>
          </el-table>
        </template>
        <el-empty v-else :description="loading ? '正在读取统计' : '暂无统计，请查询或重试'" />
      </div>
    </el-card>
    <section v-loading="loading" aria-label="用户分布">
      <div class="section-heading"><h3>全平台用户分布</h3><span class="muted">不受增长趋势的日期和入口筛选影响；点击人数查看明细</span></div>
      <div class="breakdowns">
        <UserOverviewBreakdown title="注册入口" note="首次注册的产品入口；历史未记录来源保留为未知，不根据当前账号反推。" :items="sources" :total="total" @select="openItem" />
        <UserOverviewBreakdown title="注册方式" note="首次注册使用的认证方式；后续绑定 Google 等账号不会改变此项。" :items="methods" :total="total" @select="openItem" />
        <UserOverviewBreakdown title="用户角色" note="同一用户可以拥有多个角色，各角色人数之和可能超过用户总数。" :items="report?.roles || []" :total="total" @select="openItem" />
        <UserOverviewBreakdown title="账号情况" note="各项可能重叠；超过 30/90 天未登录不含无登录记录用户，90 天人数包含在 30 天内。" :items="report?.accounts || []" :total="total" @select="openItem" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getUserOverview, type UserOverview, type UserOverviewItem, type UserGrowthRow } from '@/api/userOverview'
import { registrationSourceLabels, registrationMethodLabels, overviewUserRoute } from '@/components/users/userOverview.mjs'
import UserOverviewBreakdown from '@/components/users/UserOverviewBreakdown.vue'
import UserGrowthChart from '@/components/users/UserGrowthChart.vue'

const router = useRouter()
const report = ref<UserOverview>()
const loading = ref(false), error = ref(''), rangeError = ref('')
const dates = ref<string[]>([]), granularity = ref('day'), source = ref('')
const sourceOptions = ref<UserOverviewItem[]>([])
const metricLabels = ['用户总数', '今日新增', '近 7 天新增', '近 30 天新增', '近 7 天登录', '近 30 天登录']
const sourceLabel = (key: string) => registrationSourceLabels[key] || key
const total = computed(() => report.value?.metrics[0].count || 0)
const sources = computed(() => (report.value?.sources || []).map(item => ({ ...item, label: sourceLabel(item.key) })))
const methods = computed(() => (report.value?.methods || []).map(item => ({ ...item, label: registrationMethodLabels[item.key] || item.key })))
const trendRows = computed(() => [...(report.value?.trend || [])].reverse())
const periodTotal = computed(() => (report.value?.trend || []).reduce((sum, row) => sum + row.count, 0))
const updatedAt = computed(() => report.value ? `更新于 ${new Date(report.value.generatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}（北京时间）` : '等待查询')
const shanghaiDay = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
const disabledDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` > shanghaiDay(new Date())
function openItem(item: UserOverviewItem) { void router.push(overviewUserRoute(item.filters, item.label)) }
function selectMetric(index: number) { if (report.value) openItem(report.value.metrics[index]) }
function openTrend(row: UserGrowthRow) { void router.push(overviewUserRoute(row.filters, `${row.from} 至 ${row.to} 新增 · ${sourceLabel(report.value?.source || '') || '全部入口'}`)) }
let sequence = 0
async function search() {
  const [from, to] = dates.value || []
  rangeError.value = ''
  if (!from || !to || from > to || to > shanghaiDay(new Date()) || (Date.parse(to) - Date.parse(from)) / 86400000 >= 366) {
    rangeError.value = '请选择截至今天、最多 366 天的有效日期范围。'
    return
  }
  const request = ++sequence
  loading.value = true
  error.value = ''
  report.value = undefined
  try {
    const response = await getUserOverview({ from, to, granularity: granularity.value, source: source.value || undefined })
    if (request !== sequence) return
    if (response.code !== 0 || !response.data) throw new Error('Missing overview')
    report.value = response.data
    sourceOptions.value = response.data.sources
  } catch {
    if (request === sequence) error.value = '无法读取用户统计，请重新查询。'
  } finally {
    if (request === sequence) loading.value = false
  }
}
function reset() {
  const now = new Date()
  dates.value = [shanghaiDay(new Date(now.getTime() - 29 * 86400000)), shanghaiDay(now)]
  granularity.value = 'day'
  source.value = ''
  void search()
}
onMounted(reset)
onBeforeUnmount(() => { sequence++ })
</script>

<style scoped>
.user-overview { padding: 24px; display: flex; flex-direction: column; gap: 22px; min-width: 0; }
.page-header, .section-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.section-heading { margin-bottom: 16px; }
h2 { margin: 0 0 8px; } h3 { font-size: 16px; margin: 0; }
p, .muted { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.7; }
.stats-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px; }
.stat-card { border: 1px solid var(--el-border-color-light); border-radius: 6px; background: var(--el-bg-color); padding: 18px; text-align: left; color: var(--el-text-color-primary); cursor: pointer; font: inherit; }
.stat-card:hover:enabled { border-color: var(--el-color-primary); }
.stat-card:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
.stat-card:disabled { cursor: default; }
.stat-card span { font-size: 13px; } .stat-card strong { display: block; font-size: 28px; margin: 12px 0; overflow-wrap: anywhere; }
.stat-card small { color: var(--el-color-primary); font-size: 12px; }
.breakdowns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.range-error { color: var(--el-color-danger); }
@media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 760px) {
  .user-overview { padding: 12px; } .breakdowns { grid-template-columns: minmax(0, 1fr); }
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .stat-card { padding: 14px; } .stat-card strong { font-size: 24px; }
  .user-overview :deep(.el-form-item) { display: block; margin-right: 0; }
  .user-overview :deep(.el-form-item__content) { min-width: 0; }
  .user-overview :deep(.el-date-editor) { width: 100%; min-width: 0; }
}
</style>
