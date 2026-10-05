<template>
  <div class="rewards-page" v-loading="loading">
    <header>
      <div><h2>分享访问积分奖励</h2><p>用户通过专属链接分享网站，访客完成有效浏览后自动向分享者发放积分。</p></div>
      <div class="actions"><el-button :disabled="saving" @click="load">刷新</el-button><el-button @click="openHistory">修改历史</el-button><el-button type="primary" :loading="saving" :disabled="!settings || loading" @click="save">保存配置</el-button></div>
    </header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <template v-if="settings && view">
      <el-alert v-if="!view.identityReady" title="尚未配置服务端 IP 摘要密钥，暂不可启用。请在部署环境配置至少 32 字节的 WRISTO_SHARE_REWARD_HMAC_SECRET。" type="warning" :closable="false" show-icon />
      <el-card shadow="never">
        <el-form label-width="170px">
          <el-form-item label="启用分享奖励"><el-switch v-model="settings.enabled" :disabled="!view.identityReady" /></el-form-item>
          <el-form-item label="每次有效访问"><el-input-number v-model="settings.creditsPerVisit" :min="1" :max="10000" :precision="0" /><span class="unit">积分</span></el-form-item>
          <el-form-item label="前台可见浏览时长"><el-input-number v-model="settings.minimumVisibleSeconds" :min="1" :max="300" :precision="0" /><span class="unit">秒</span></el-form-item>
          <el-form-item label="每位分享者每日上限"><el-input-number v-model="settings.userDailyCredits" :min="1" :max="1000000" :precision="0" /><span class="unit">积分</span></el-form-item>
          <el-form-item label="全站每日发放上限"><el-input-number v-model="settings.globalDailyCredits" :min="1" :max="100000000" :precision="0" /><span class="unit">积分</span></el-form-item>
          <el-form-item label="活动开始"><el-date-picker v-model="settings.startsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ssZ" placeholder="不限制" clearable /></el-form-item>
          <el-form-item label="活动结束"><el-date-picker v-model="settings.endsAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ssZ" placeholder="不限制" clearable /></el-form-item>
          <el-form-item label="每日统计时区">Asia/Shanghai（UTC+8）</el-form-item>
          <el-form-item label="去重范围">全站同 IP 每天最多贡献一次奖励，同时按访客 Cookie 和已登录账号去重。</el-form-item>
        </el-form>
        <p>本人访问不奖励。达到上限后仍记录有效访问；修改额度影响后续发奖，历史流水金额和规则保持不变。活动时间按当前浏览器时区输入。</p>
      </el-card>
      <el-card shadow="never">
        <template #header><strong>今日统计 · {{ view.stats.day }}（UTC+8）</strong></template>
        <el-descriptions :column="4" border>
          <el-descriptions-item label="发起访问">{{ view.stats.visits }}</el-descriptions-item>
          <el-descriptions-item label="有效访问">{{ view.stats.validVisits }}</el-descriptions-item>
          <el-descriptions-item label="奖励次数">{{ view.stats.rewardedVisits }}</el-descriptions-item>
          <el-descriptions-item label="发放积分">{{ view.stats.credits }}</el-descriptions-item>
        </el-descriptions>
        <p>发起访问按开始时间统计，有效访问与发奖按确认时间统计；有效访问包含重复访问和因额度限制未发奖的访问。</p>
      </el-card>
    </template>
    <el-card shadow="never">
      <template #header><strong>访问与奖励记录</strong></template>
      <el-alert v-if="visitsError" :title="visitsError" type="error" :closable="false" />
      <el-table :data="visits" v-loading="visitsLoading">
        <el-table-column prop="ownerId" label="分享者 ID" width="120" />
        <el-table-column prop="productId" label="表盘产品 ID" width="125" />
        <el-table-column prop="channel" label="渠道" width="100" />
        <el-table-column label="访问时间" min-width="180"><template #default="{ row }">{{ formatTime(row.startedAt) }}</template></el-table-column>
        <el-table-column label="结果 / 未发奖原因" min-width="180"><template #default="{ row }">{{ statuses[row.status] || row.status }}</template></el-table-column>
        <el-table-column prop="credits" label="奖励积分" width="100" />
        <el-table-column label="规则快照" width="140"><template #default="{ row }"><el-popover v-if="row.rulesJson" trigger="click" width="420"><pre>{{ row.rulesJson }}</pre><template #reference><el-button link>查看规则</el-button></template></el-popover></template></el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next" @current-change="loadVisits" />
    </el-card>
    <el-drawer v-model="historyVisible" title="分享奖励 · 修改历史" size="min(800px, 96vw)">
      <el-alert v-if="historyError" :title="historyError" type="error" :closable="false" />
      <el-table :data="histories" v-loading="historyLoading">
        <el-table-column prop="updatedBy" label="操作人" width="130" /><el-table-column prop="createdAt" label="时间" width="180" />
        <el-table-column label="变更"><template #default="{ row }"><details><summary>查看配置</summary><pre>{{ row.oldValue || '默认配置' }}</pre><pre>{{ row.newValue }}</pre></details></template></el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getShareRewards, saveShareRewards, getShareVisits, type ShareRewardSettings, type ShareRewardView, type ShareVisitEntry } from '@/api/shareRewards'
import { getConfigHistory } from '@/api/config'
import type { GlobalConfigHistory } from '@/types/ops'
const settings = ref<ShareRewardSettings>(), view = ref<ShareRewardView>()
const loading = ref(false), saving = ref(false), error = ref('')
const visits = ref<ShareVisitEntry[]>([]), page = ref(1), total = ref(0), visitsLoading = ref(false), visitsError = ref('')
const histories = ref<GlobalConfigHistory[]>([]), historyVisible = ref(false), historyLoading = ref(false), historyError = ref('')
const statuses: Record<string, string> = { PENDING: '等待有效浏览确认', REWARDED: '已发奖', DUPLICATE: '今日已贡献奖励', SELF: '分享者本人访问', INELIGIBLE: '账号或表盘已不可用', USER_LIMIT: '分享者今日积分已达上限', GLOBAL_LIMIT: '全站今日积分已达上限', EXPIRED: '访问凭证已过期', DISABLED: '活动未开启或已结束' }
const formatTime = (value: string) => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
function apply(data: ShareRewardView) { view.value = data; settings.value = { ...data.settings } }
async function load() {
  loading.value = true; error.value = ''; settings.value = undefined; view.value = undefined
  try { const result = await getShareRewards(); if (result.code !== 0 || !result.data) throw new Error(); apply(result.data) }
  catch { error.value = '无法读取分享奖励配置，请刷新后重试。' }
  finally { loading.value = false }
  await loadVisits()
}
async function save() {
  if (!settings.value || saving.value) return
  const s = settings.value
  if ([[s.creditsPerVisit, 10000], [s.minimumVisibleSeconds, 300], [s.userDailyCredits, 1000000], [s.globalDailyCredits, 100000000]].some(([n, max]) => !Number.isInteger(n) || n < 1 || n > max) || s.creditsPerVisit > Math.min(s.userDailyCredits, s.globalDailyCredits)) {
    ElMessage.warning('请检查整数额度与浏览时长，单次积分不能超过每日上限'); return
  }
  if (s.startsAt && s.endsAt && new Date(s.startsAt) >= new Date(s.endsAt)) { ElMessage.warning('结束时间须晚于开始时间'); return }
  saving.value = true; error.value = ''
  try {
    const result = await saveShareRewards({ ...s, startsAt: s.startsAt ? new Date(s.startsAt).toISOString() : null, endsAt: s.endsAt ? new Date(s.endsAt).toISOString() : null })
    if (result.code !== 0 || !result.data) throw new Error()
    apply(result.data); ElMessage.success('分享奖励配置已保存')
  } catch { error.value = '未能确认保存结果，请刷新核对配置后重试。' }
  finally { saving.value = false }
}
let visitsRequest = 0
async function loadVisits() {
  const current = ++visitsRequest
  visitsLoading.value = true; visitsError.value = ''
  try {
    const result = await getShareVisits(page.value)
    if (current !== visitsRequest) return
    if (result.code !== 0 || !result.data) throw new Error()
    visits.value = result.data.items; total.value = result.data.total
  } catch { if (current === visitsRequest) { visits.value = []; visitsError.value = '无法读取访问记录，请刷新重试。' } }
  finally { if (current === visitsRequest) visitsLoading.value = false }
}
async function openHistory() {
  historyVisible.value = true; historyLoading.value = true; historyError.value = ''; histories.value = []
  try { const result = await getConfigHistory('studio.share.rewards', 'business'); if (result.code !== 0 || !result.data) throw new Error(); histories.value = result.data }
  catch { historyError.value = '无法读取修改历史。' }
  finally { historyLoading.value = false }
}
onMounted(load)
</script>
<style scoped>
.rewards-page { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
header, .actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
h2 { margin: 0 0 8px; }
p { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.6; }
.unit { margin-left: 10px; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
