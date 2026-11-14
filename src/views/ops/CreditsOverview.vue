<template>
  <div class="credits-page overview">
    <header><div><h2>积分与 AI 运营总览</h2><p>奖励积分、AI 点数和供应商成本分别核对。{{ rangeLabel }}</p></div><el-button :loading="loading" @click="load">刷新概览</el-button></header>
    <div class="quick-actions">
      <router-link to="/ops/points-ledger"><strong>核对全平台流水</strong><span>奖励积分 · AI 点数 · 业务关联</span></router-link>
      <router-link to="/ops/reward-rules"><strong>配置奖励</strong><span>用户 · 小程序 · 分享 · 创作者</span></router-link>
      <router-link to="/ops/redemptions"><strong>管理兑换</strong><span>默认额度 · 表盘覆盖 · 资源</span></router-link>
      <router-link to="/ops/ai-scenes"><strong>调整 AI 扣点</strong><span>场景开关 · 模型 · 点数</span></router-link>
    </div>
    <section>
      <div class="section-title"><h3>AI 点数与用量</h3><router-link to="/ops/credit-statistics">查看点数收支 →</router-link></div>
      <el-alert v-if="errors.credits" :title="errors.credits" type="error" :closable="false" show-icon />
      <el-alert v-if="errors.usage" :title="errors.usage" type="error" :closable="false" show-icon />
      <div class="metrics" v-loading="loading">
        <el-card shadow="never"><span>当前可用 AI 点数</span><strong>{{ count(credits?.accounts.available) }}</strong><small>当前余额 · 不受统计期间影响</small></el-card>
        <el-card shadow="never"><span>近 30 天净消耗</span><strong>{{ count(credits?.period.netConsumed) }}</strong><small>消耗减 AI 退回 · 单位：AI 点数</small></el-card>
        <el-card shadow="never"><span>近 30 天 AI 调用</span><strong>{{ count(usage?.totals.calls) }}</strong><small>失败 {{ count(usage?.totals.failed_calls) }} · 待完成 {{ count(usage?.totals.pending_calls) }}</small></el-card>
        <el-card shadow="never"><span>近 30 天待估算调用</span><strong>{{ usage ? count((usage.totals.unpriced_calls || 0) + (usage.totals.unknown_cost_calls || 0)) : '—' }}</strong><small>缺价格或计费用量，不视为零成本</small></el-card>
      </div>
      <div class="cost-strip" v-if="usage"><strong>近 30 天预估成本</strong><span v-for="cost in usage.currencies" :key="cost.cost_currency">{{ cost.cost_currency }} {{ money(cost.estimated_cost) }} <small>（已估算 {{ count(cost.priced_calls) }} 次）</small></span><span v-if="!usage.currencies.length">暂无已估算成本</span><router-link to="/ops/ai-usage">查看用量与成本 →</router-link></div>
    </section>
    <section class="operations-grid">
      <el-card shadow="never">
        <template #header><div class="section-title"><h3>奖励运营</h3><router-link to="/ops/reward-records">记录与审核 →</router-link></div></template>
        <el-alert v-if="errors.social" :title="errors.social" type="error" :closable="false" />
        <router-link class="operation-row" to="/ops/reward-records?tab=social"><span>社交分享待审核</span><strong>{{ count(pendingReviews) }}</strong></router-link>
        <el-alert v-if="errors.visits" :title="errors.visits" type="error" :closable="false" />
        <router-link class="operation-row" to="/ops/reward-records?tab=visits"><span>今日分享访问发放 · 奖励积分</span><strong>{{ count(visits?.stats.credits) }}</strong></router-link>
        <p class="muted">分享统计仅覆盖分享访问奖励，不代表全平台奖励积分发放总额。今日按北京时间统计。</p>
        <el-alert v-if="errors.creator" :title="errors.creator" type="error" :closable="false" />
        <router-link class="operation-row" to="/ops/reward-records?tab=creators"><span>创作者结算</span><el-tag v-if="creator" :type="creator.job.failure ? 'danger' : 'info'">{{ creator.job.running ? '运行中' : jobLabels[creator.job.status] || creator.job.status }}</el-tag><span v-else>—</span></router-link>
        <p class="muted">最近结算至 {{ creator?.settlement.lastSettledDay || '—' }}</p>
      </el-card>
      <el-card shadow="never">
        <template #header><h3>核对与处理</h3></template>
        <div class="operation-row"><span>AI 点数账户与流水</span><el-tag v-if="credits" :type="credits.accounts.discrepancy === 0 ? 'success' : 'danger'">{{ credits.accounts.discrepancy === 0 ? '一致' : `差额 ${count(credits.accounts.discrepancy)}` }}</el-tag><span v-else>未读取</span></div>
        <router-link v-if="credits && credits.accounts.discrepancy !== 0" class="action-link" to="/ops/credit-statistics">核对点数收支 →</router-link>
        <div class="operation-row"><span>调用缺少成本价格</span><strong>{{ count(usage?.totals.unpriced_calls) }}</strong></div>
        <router-link class="action-link" to="/ops/ai-prices">维护成本价格 →</router-link>
        <div class="operation-row"><span>调用缺少计费用量</span><strong>{{ count(usage?.totals.unknown_cost_calls) }}</strong></div>
        <router-link class="action-link" to="/ops/ai-usage?group=calls">检查调用明细 →</router-link>
        <p class="muted">价格新版本不改写历史调用。已读取结果独立展示，读取失败不会记为零。</p>
      </el-card>
    </section>
  </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { getCreditStatistics, type CreditStatistics } from '@/api/creditStatistics'
import { getUsageOverview, type UsageOverview } from '@/api/aiUsage'
import { getShareRewards, type ShareRewardView } from '@/api/shareRewards'
import { getCreatorRewards, type CreatorRewardView } from '@/api/creatorRewards'
import { socialRewardsApi } from '@/api/socialRewards'
const credits = ref<CreditStatistics>(), usage = ref<UsageOverview>(), visits = ref<ShareRewardView>(), creator = ref<CreatorRewardView>(), pendingReviews = ref<number>()
const loading = ref(false), rangeLabel = ref('')
const errors = reactive({ credits: '', usage: '', visits: '', creator: '', social: '' })
const jobLabels: Record<string, string> = { IDLE: '尚未运行', RUNNING: '运行中', SUCCESS: '成功', FAILED: '失败，等待重试' }
const count = (value?: number | null) => value == null ? '—' : Number(value).toLocaleString('zh-CN')
const money = (value: number) => Number(value) > 0 && Number(value) < 0.0001 ? '< 0.0001' : Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
const day = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value)
let sequence = 0
async function load() {
  const request = ++sequence
  loading.value = true
  credits.value = undefined; usage.value = undefined; visits.value = undefined; creator.value = undefined; pendingReviews.value = undefined
  for (const key of Object.keys(errors) as (keyof typeof errors)[]) errors[key] = ''
  const now = new Date(), range = { from: day(new Date(now.getTime() - 29 * 86400000)), to: day(now) }
  rangeLabel.value = `${range.from} 至 ${range.to}（北京时间）`
  async function read<T>(key: keyof typeof errors, task: Promise<{ code: number; data?: T }>, apply: (data: T) => void) {
    try { const result = await task; if (request !== sequence) return; if (result.code !== 0 || !result.data) throw new Error(); apply(result.data) }
    catch { if (request === sequence) errors[key] = `${({ credits: 'AI 点数收支', usage: 'AI 用量', visits: '分享访问', creator: '创作者结算', social: '待审核记录' })[key]}读取失败，请刷新重试。` }
  }
  await Promise.allSettled([
    read('credits', getCreditStatistics(range), data => { credits.value = data }),
    read('usage', getUsageOverview(range), data => { usage.value = data }),
    read('visits', getShareRewards(), data => { visits.value = data }),
    read('creator', getCreatorRewards(), data => { creator.value = data }),
    read('social', socialRewardsApi.list(1, 'PENDING'), data => { pendingReviews.value = data.total }),
  ])
  if (request === sequence) loading.value = false
}
onMounted(load)
onUnmounted(() => { sequence++ })
</script>
<style scoped>
a { color: var(--el-color-primary); text-decoration: none; font-size: 13px; }
.quick-actions, .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.quick-actions a { padding: 14px 16px; border: 1px solid var(--el-border-color-light); border-radius: 8px; background: var(--el-fill-color-extra-light); }
.quick-actions a:hover { border-color: var(--el-color-primary); }.quick-actions span { display: block; margin-top: 6px; font-size: 12px; color: var(--el-text-color-secondary); }
.section-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }h3 { margin: 0; }.el-card .section-title { margin-bottom: 0; }
.metrics strong { display: block; font-size: 26px; margin: 10px 0; overflow-wrap: anywhere; }.metrics span { font-size: 13px; }small, .muted { font-size: 12px; color: var(--el-text-color-secondary); }
.cost-strip { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; padding: 14px 0; font-size: 13px; }.cost-strip a { margin-left: auto; }
.operations-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }.operation-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; color: var(--el-text-color-regular); font-size: 13px; border-bottom: 1px solid var(--el-border-color-lighter); }.action-link { display: inline-block; margin-top: 8px; }.el-alert { margin-bottom: 12px; }
@media(max-width:1100px) { .metrics, .quick-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media(max-width:600px) { .operations-grid { grid-template-columns: 1fr; }.quick-actions { grid-template-columns: 1fr; }.metrics strong { font-size: 22px; } }
</style>
