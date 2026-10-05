<template>
  <div class="credit-statistics">
    <header class="page-header">
      <div><h2>积分统计</h2><p>核对全平台积分发放、消耗与剩余余额。</p></div>
      <el-button @click="$router.push('/ops/ai-usage')">AI 用量与成本</el-button>
    </header>

    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <section v-loading="loading" aria-label="全平台累计统计">
      <div class="section-heading"><h3>全平台概览</h3><span class="muted">累计与当前余额不受下方日期筛选影响 · {{ updatedAt }}</span></div>
      <div class="stats">
        <el-card shadow="never"><span>累计发放</span><strong>{{ count(report?.allTime.issued) }}</strong><small>赠送、奖励、充值及后台增加</small></el-card>
        <el-card shadow="never"><span>累计消耗</span><strong>{{ count(report?.allTime.consumed) }}</strong><small>AI 退回 {{ count(report?.allTime.refunded) }} · 净消耗 {{ count(report?.allTime.netConsumed) }}</small></el-card>
        <el-card shadow="never"><span>当前剩余可用积分</span><strong>{{ count(report?.accounts.available) }}</strong><small>逐账户扣除欠额后，汇总正余额</small></el-card>
        <el-card shadow="never"><span>当前退款欠额</span><strong>{{ count(report?.accounts.debt) }}</strong><small>全平台净余额 {{ count(report?.accounts.netBalance) }}</small></el-card>
      </div>
      <p v-if="report" class="muted reconciliation">
        累计回收 {{ count(report.allTime.recovered) }} · 回收撤销 {{ count(report.allTime.restored) }} ·
        流水净结余 {{ count(report.accounts.ledgerBalance) }}
        <el-tag :type="report.accounts.discrepancy === 0 ? 'success' : 'danger'" size="small">{{ report.accounts.discrepancy === 0 ? '账户与流水一致' : `账户与流水差额 ${count(report.accounts.discrepancy)}` }}</el-tag>
      </p>
    </section>
    <el-alert v-if="report && report.accounts.discrepancy !== 0" title="账户余额与累计流水存在差额，请核对历史数据。每日结余按已记录流水计算。" type="warning" :closable="false" show-icon />

    <el-card shadow="never">
      <el-form inline @submit.prevent="search">
        <el-form-item label="日期范围">
          <el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" :clearable="false" :disabled-date="disabledDate" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <el-form-item><el-button type="primary" native-type="submit" :loading="loading">查询</el-button><el-button :disabled="loading" @click="reset">最近 30 天</el-button></el-form-item>
      </el-form>
      <span class="muted">北京时间（UTC+8），含结束日期；每次最多 366 天。今天的结余为查询时的暂计值。</span>
      <p v-if="rangeError" class="range-error" role="alert">{{ rangeError }}</p>
    </el-card>

    <el-card v-loading="loading" shadow="never">
      <div class="section-heading"><h3>所选期间</h3><span class="muted">{{ report ? `${report.from} 至 ${report.to}` : '—' }}</span></div>
      <div class="period-stats">
        <div v-for="metric in metrics" :key="metric.key"><span>{{ metric.label }}</span><strong>{{ count(report?.period[metric.key]) }}</strong></div>
      </div>
      <p class="muted">期初净结余 {{ count(report?.openingBalance) }} + 本期净变动 {{ count(report?.period.netChange) }} = 期末净结余 {{ count(report?.closingBalance) }}</p>
      <p class="muted">净变动 = 发放 − 消耗 + AI 退回 + 回收撤销 − 回收。净消耗 = 消耗 − AI 退回；跨日退回可能使本期净消耗为负。</p>
    </el-card>

    <el-card shadow="never">
      <el-tabs v-model="activeTab"><el-tab-pane label="每日明细" name="daily" /><el-tab-pane label="来源分类" name="sources" /></el-tabs>
      <el-table v-if="activeTab === 'daily'" :data="dailyRows" v-loading="loading" row-key="date" empty-text="暂无统计数据，请查询或重试" max-height="600">
        <el-table-column label="日期" width="165" fixed><template #default="{ row }">{{ row.date }} <el-tag v-if="row.partial" size="small" type="info">暂计</el-tag></template></el-table-column>
        <el-table-column label="期初净结余" min-width="125" align="right"><template #default="{ row }">{{ count(row.openingBalance) }}</template></el-table-column>
        <el-table-column v-for="metric in metrics" :key="metric.key" :label="metric.label" min-width="115" align="right"><template #default="{ row }">{{ count(row.totals[metric.key]) }}</template></el-table-column>
        <el-table-column label="日末净结余" min-width="135" align="right"><template #default="{ row }"><strong>{{ count(row.closingBalance) }}</strong></template></el-table-column>
      </el-table>
      <template v-else>
        <el-select v-model="sourceFilter" aria-label="筛选积分来源" placeholder="全部来源" clearable class="source-filter">
          <el-option v-for="type in sourceTypes" :key="type" :value="type" :label="typeLabels[type] || type" />
        </el-select>
        <el-table :data="sourceRows" v-loading="loading" :row-key="sourceKey" empty-text="所选期间暂无此类积分流水">
          <el-table-column label="来源 / 原因" min-width="210"><template #default="{ row }">{{ typeLabels[row.type] || row.type }}<div v-if="row.reason" class="muted">{{ reasonLabels[row.reason] || row.reason }}</div></template></el-table-column>
          <el-table-column v-for="metric in metrics" :key="metric.key" :label="metric.label" min-width="115" align="right"><template #default="{ row }">{{ count(row.totals[metric.key]) }}</template></el-table-column>
        </el-table>
      </template>
      <p class="muted">AI 退回不重复计入发放；购买退款、奖励追回及后台扣减计入回收。日末净结余包含欠额，按全量历史流水累计，无流水日期自动延续前日结余。</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getCreditStatistics, type CreditBreakdown, type CreditStatistics, type CreditTotals } from '@/api/creditStatistics'

const report = ref<CreditStatistics>()
const dates = ref<string[]>([])
const loading = ref(false), error = ref(''), rangeError = ref('')
const activeTab = ref('daily'), sourceFilter = ref('')
const metrics: { key: keyof CreditTotals; label: string }[] = [
  { key: 'issued', label: '发放' }, { key: 'consumed', label: '消耗' },
  { key: 'refunded', label: 'AI 退回' }, { key: 'netConsumed', label: '净消耗' },
  { key: 'recovered', label: '回收' }, { key: 'restored', label: '回收撤销' },
]
const typeLabels: Record<string, string> = {
  REGISTRATION_GIFT: '注册赠送', PURCHASE: '购买充值', PURCHASE_REFUND: '购买退款回收', PURCHASE_REFUND_REVERSAL: '购买退款回收撤销',
  ADMIN_CREDIT: '后台增加', ADMIN_DEBIT: '后台扣减', SHARE_VISIT_REWARD: '分享访问奖励',
  USER_CHECK_IN: '每日签到', USER_DOWNLOAD: '首次下载奖励', USER_PURCHASE: '用户购买奖励', USER_PURCHASE_REFUND: '用户购买奖励追回',
  CREATOR_DOWNLOAD: '创作者下载奖励', CREATOR_PURCHASE: '创作者购买奖励', CREATOR_PURCHASE_REFUND: '创作者购买奖励追回',
  AI_TAGS: 'AI 标签', AI_DESCRIPTION: 'AI 描述', AI_BANNER: 'Banner 图片', AI_WATCHFACE: 'AI 表盘', AI_WATCHFACE_ADJUST: '表盘局部调整',
  AI_WATCHFACE_REFUND: '表盘生成积分退回', AI_WATCHFACE_ADJUST_REFUND: '表盘调整积分退回',
}
const reasonLabels: Record<string, string> = {
  RECHARGE: '充值', PLATFORM_GIFT: '平台赠送', ACTIVITY_REWARD: '活动奖励', SERVICE_COMPENSATION: '服务补偿',
  REFUND_RECOVERY: '退款回收', CORRECTION: '误充值纠正', VIOLATION: '违规扣减', OTHER: '其他',
}
const count = (value?: number) => value == null ? '—' : value.toLocaleString('zh-CN')
const shanghaiDay = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
const disabledDate = (date: Date) => {
  // Date picker cells are local calendar dates, even when the admin is in a different timezone.
  const localDay = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return localDay > shanghaiDay(new Date())
}
const updatedAt = computed(() => report.value ? `更新于 ${new Date(report.value.generatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}（北京时间）` : '等待查询')
const dailyRows = computed(() => [...(report.value?.daily || [])].reverse())
const sourceTypes = computed(() => [...new Set(report.value?.breakdown.map(row => row.type) || [])])
const sourceRows = computed(() => (report.value?.breakdown || []).filter(row => !sourceFilter.value || row.type === sourceFilter.value))
const sourceKey = (row: CreditBreakdown) => `${row.type}:${row.reason || ''}`
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
  sourceFilter.value = ''
  try {
    const result = await getCreditStatistics({ from, to })
    if (request !== sequence) return
    if (result.code !== 0 || !result.data) throw new Error('Missing statistics')
    report.value = result.data
  } catch {
    if (request === sequence) error.value = '无法读取积分统计，请重新查询。'
  } finally {
    if (request === sequence) loading.value = false
  }
}

function reset() {
  const now = new Date()
  dates.value = [shanghaiDay(new Date(now.getTime() - 29 * 86400000)), shanghaiDay(now)]
  void search()
}
onMounted(reset)
onUnmounted(() => { sequence++ })
</script>

<style scoped>
.credit-statistics { padding: 24px; display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.page-header, .section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
h2 { margin: 0 0 8px; } h3 { margin: 0; font-size: 16px; }
.section-heading { margin-bottom: 16px; }
p, .muted, small { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.7; }
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.stats strong { display: block; font-size: 28px; margin: 12px 0; overflow-wrap: anywhere; }
.stats span, .period-stats span { font-size: 13px; }
.reconciliation { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 0; }
.period-stats { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px; }
.period-stats strong { display: block; font-size: 22px; margin: 10px 0; overflow-wrap: anywhere; }
.source-filter { width: 250px; max-width: 100%; margin-bottom: 16px; }
.range-error { color: var(--el-color-danger); }
@media (max-width: 1100px) { .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } .period-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 600px) {
  .credit-statistics { padding: 12px; } .stats, .period-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .stats strong { font-size: 23px; } .credit-statistics :deep(.el-card__body) { padding: 14px; }
  .credit-statistics :deep(.el-form-item) { display: block; margin-right: 0; }
  .credit-statistics :deep(.el-form-item__content) { min-width: 0; }
  .credit-statistics :deep(.el-date-editor) { width: 100%; min-width: 0; }
}
</style>
