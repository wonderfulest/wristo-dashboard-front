<template>
  <div class="accounts">
    <header class="page-header"><div><h2>用户账户</h2><p>奖励积分与 AI 点数独立记账，分别查看余额、流水和调整记录。</p></div><el-button :disabled="!userId || blocked" @click="$router.push({ path: '/ops/points-ledger', query: { userId } })">全平台收支流水</el-button><el-button :disabled="!userId || blocked" @click="openUsage">查看 AI 用量</el-button></header>
    <el-card shadow="never">
      <div class="toolbar"><UserSelect v-model="userId" placeholder="搜索用户名或邮箱" :disabled="blocked" class="user-select" /><el-button :disabled="!userId || loading || aiLoading || blocked" @click="refreshAll">刷新账户</el-button><span v-if="userId" class="muted">用户 ID：{{ userId }}</span></div>
    </el-card>
    <el-empty v-if="!userId" description="选择用户后查看两类账户及收支流水" />
    <template v-else>
      <div class="account-grid">
        <el-card shadow="never" v-loading="loading">
          <template #header><div class="card-heading"><strong>奖励积分</strong><el-button :disabled="!account || blocked" @click="rewardDialog = true">调整奖励积分</el-button></div></template>
          <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
          <div class="balance"><strong>{{ count(account?.available) }}</strong><span>可用余额</span></div>
          <div class="balance-detail"><span>待补足欠额 <b>{{ count(account?.debt) }}</b></span><span>净余额 <b>{{ count(account?.balance) }}</b></span></div>
        </el-card>
        <el-card shadow="never" v-loading="aiLoading">
          <template #header><div class="card-heading"><strong>AI 点数</strong><el-button :disabled="aiBalance == null || blocked" @click="aiDialog?.open(userId)">调整 AI 点数</el-button></div></template>
          <el-alert v-if="aiError" :title="aiError" type="error" :closable="false" show-icon />
          <div class="balance"><strong>{{ count(aiBalance) }}</strong><span>账户余额</span></div>
          <p class="muted">用于 AI 功能及相关权益。首次查询可能结算尚未领取的注册赠送；人工调整不生成付费订单。</p>
        </el-card>
      </div>
      <el-card shadow="never">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="奖励积分流水" name="reward">
            <el-table :data="entries" v-loading="loading" :empty-text="error ? '读取失败，请刷新账户重试' : '暂无奖励积分流水'" row-key="id">
              <el-table-column label="时间（北京时间）" min-width="175"><template #default="{row}">{{ time(row.createdAt) }}</template></el-table-column>
              <el-table-column label="变动" width="110" align="right"><template #default="{row}"><span :class="row.delta > 0 ? 'positive' : 'negative'">{{ signed(row.delta) }}</span></template></el-table-column>
              <el-table-column prop="description" label="说明" min-width="200" />
              <el-table-column prop="eventKey" label="来源编号" min-width="180" show-overflow-tooltip />
            </el-table>
            <el-pagination v-model:current-page="page" :total="total" :page-size="20" layout="total, prev, pager, next" :disabled="loading || blocked" @current-change="load" />
          </el-tab-pane>
          <el-tab-pane label="AI 点数流水" name="ai">
            <el-table :data="aiEntries" v-loading="aiLoading" :empty-text="aiError ? '读取失败，请刷新账户重试' : '暂无 AI 点数流水'" row-key="id">
              <el-table-column label="时间（北京时间）" min-width="175"><template #default="{row}">{{ time(row.created_at) }}</template></el-table-column>
              <el-table-column label="类型 / 原因" min-width="180"><template #default="{row}">{{ creditTypes[row.type] || row.type }}<div class="muted">{{ creditReasons[row.reason] || row.reason || '—' }}</div></template></el-table-column>
              <el-table-column label="变动" width="110" align="right"><template #default="{row}"><span :class="row.delta > 0 ? 'positive' : 'negative'">{{ signed(row.delta) }}</span></template></el-table-column>
              <el-table-column label="变动后余额" width="125" align="right"><template #default="{row}">{{ count(row.balance_after) }}</template></el-table-column>
              <el-table-column label="操作人" min-width="120"><template #default="{row}">{{ row.operator_name || row.operator_id || '系统' }}</template></el-table-column>
              <el-table-column prop="note" label="说明" min-width="180" show-overflow-tooltip />
            </el-table>
            <el-pagination v-model:current-page="aiPage" :total="aiTotal" :page-size="20" layout="total, prev, pager, next" :disabled="aiLoading || blocked" @current-change="loadAi" />
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </template>
    <el-dialog v-model="rewardDialog" title="调整奖励积分" width="min(560px, 95vw)" :close-on-click-modal="false" :close-on-press-escape="!saving && !pending" :show-close="!saving && !pending">
      <el-form label-position="top" @submit.prevent="submit">
        <p>用户 ID：{{ userId }} · 当前净余额：{{ count(account?.balance) }} 奖励积分</p>
        <el-form-item label="操作"><el-radio-group v-model="direction" :disabled="saving || !!pending"><el-radio-button value="ADD">增加</el-radio-button><el-radio-button value="REMOVE">扣减</el-radio-button></el-radio-group></el-form-item>
        <el-form-item label="奖励积分数量"><el-input-number v-model="amount" :min="1" :max="1000000" :precision="0" :disabled="saving || !!pending" /></el-form-item>
        <el-form-item label="调整原因（必填）"><el-input v-model="reason" type="textarea" maxlength="180" show-word-limit :disabled="saving || !!pending" /></el-form-item>
        <p v-if="account && amount" class="muted">调整后预计净余额：{{ count(account.balance + delta) }} 奖励积分。最终以入账结果为准。</p>
        <el-alert v-if="adjustError" :title="adjustError" type="error" :closable="false" />
        <el-alert v-if="pending" title="提交结果尚未确认，请使用原请求重试；重复请求不会重复入账。核实前请保留此页面。" type="warning" :closable="false" />
        <div class="dialog-actions"><el-button :disabled="saving || !!pending" @click="rewardDialog = false">取消</el-button><el-button type="primary" native-type="submit" :loading="saving" :disabled="loading || (!account && !pending)">{{ pending ? '重试确认结果' : '确认调整' }}</el-button></div>
      </el-form>
    </el-dialog>
    <StudioCreditsDialog ref="aiDialog" lock-user @updated="loadAi" @busy-change="aiBusy = $event" />
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserSelect from '@/components/users/UserSelect.vue'
import StudioCreditsDialog from '@/components/users/StudioCreditsDialog.vue'
import { creditReasons, creditTypes } from '@/utils/creditLabels'
import { getRewardAccount, getRewardHistory, adjustRewardPoints, type RewardAccount, type RewardEntry, type RewardAdjustment } from '@/api/rewardPoints'
import { getCreditAccount, getCreditHistory, type CreditEntry } from '@/api/studioCredits'
const route = useRoute(), router = useRouter()
function queryUser(value: unknown): number | undefined { const id = Number(value); return Number.isSafeInteger(id) && id > 0 ? id : undefined }
const userId = ref<number | undefined>(queryUser(route.query.userId)), account = ref<RewardAccount>(), entries = ref<RewardEntry[]>([])
const page = ref(1), total = ref(0), loading = ref(false), saving = ref(false), error = ref(''), adjustError = ref('')
const aiBalance = ref<number>(), aiEntries = ref<CreditEntry[]>([]), aiPage = ref(1), aiTotal = ref(0), aiLoading = ref(false), aiError = ref(''), aiBusy = ref(false)
const direction = ref<'ADD' | 'REMOVE'>('ADD'), amount = ref(1), delta = computed(() => direction.value === 'ADD' ? amount.value : -amount.value)
const reason = ref(''), pending = ref<{id: number; body: RewardAdjustment}>(), rewardDialog = ref(false), activeTab = ref('reward')
const aiDialog = ref<InstanceType<typeof StudioCreditsDialog>>()
const blocked = computed(() => saving.value || !!pending.value || aiBusy.value)
const count = (value?: number) => value == null ? '—' : value.toLocaleString('zh-CN')
const signed = (value: number) => `${value > 0 ? '+' : ''}${count(value)}`
const time = (value: string) => value ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : '—'
let sequence = 0, aiSequence = 0
async function load() {
  const id = userId.value, ticket = ++sequence
  account.value = undefined; entries.value = []; total.value = 0; error.value = ''
  if (!id) { loading.value = false; return }
  loading.value = true
  try {
    const [a, h] = await Promise.all([getRewardAccount(id), getRewardHistory(id, page.value)])
    if (ticket !== sequence) return
    if (a.code !== 0 || h.code !== 0 || !a.data || !h.data) throw new Error()
    account.value = a.data; entries.value = h.data.items; total.value = h.data.total
  } catch { if (ticket === sequence) error.value = '无法读取奖励积分，请刷新账户重试。' }
  finally { if (ticket === sequence) loading.value = false }
}
async function loadAi() {
  const id = userId.value, ticket = ++aiSequence
  aiBalance.value = undefined; aiEntries.value = []; aiTotal.value = 0; aiError.value = ''
  if (!id) { aiLoading.value = false; return }
  aiLoading.value = true
  try {
    const [a, h] = await Promise.all([getCreditAccount(id), getCreditHistory(id, aiPage.value)])
    if (ticket !== aiSequence) return
    if (a.code !== 0 || h.code !== 0 || !a.data || !h.data) throw new Error()
    aiBalance.value = a.data.balance; aiEntries.value = h.data.items; aiTotal.value = h.data.total
  } catch { if (ticket === aiSequence) aiError.value = '无法读取 AI 点数，请刷新账户重试。' }
  finally { if (ticket === aiSequence) aiLoading.value = false }
}
async function refreshAll() { await Promise.allSettled([load(), loadAi()]) }
function openUsage() { void router.push({ path: '/ops/ai-usage', query: { userId: userId.value } }) }
async function submit() {
  if (saving.value || !userId.value) return
  if (!pending.value) {
    if (!Number.isInteger(amount.value) || amount.value < 1 || amount.value > 1000000 || !reason.value.trim() || reason.value.trim().length > 180) { ElMessage.warning('请填写 1 至 1000000 的整数和调整原因'); return }
    const id = userId.value, body = { delta: delta.value, reason: reason.value.trim(), idempotencyKey: crypto.randomUUID() }
    saving.value = true
    try { await ElMessageBox.confirm(`用户 ${id} 的奖励积分将${body.delta > 0 ? '增加' : '扣减'} ${Math.abs(body.delta)}，原因：${body.reason}`, '确认调整') }
    catch { saving.value = false; return }
    pending.value = { id, body }
  }
  saving.value = true; adjustError.value = ''
  try {
    const r = await adjustRewardPoints(pending.value.id, pending.value.body)
    if (r.code !== 0 || !r.data) throw new Error()
    pending.value = undefined; reason.value = ''; rewardDialog.value = false; page.value = 1; ElMessage.success('奖励积分已调整'); await load()
  } catch (cause: unknown) {
    const failure = cause as { code?: number; msg?: string; response?: { status?: number; data?: { msg?: string } } }
    const code = failure.response?.status ?? failure.code
    if (typeof code === 'number' && code >= 400 && code < 500) {
      pending.value = undefined
      adjustError.value = failure.msg || failure.response?.data?.msg || '调整未获批准，请核对账户和原因。'
    } else adjustError.value = '未能确认调整结果，请使用原请求重试。'
  }
  finally { saving.value = false }
}
function allowNavigation() { if (!blocked.value) return true; ElMessage.warning('账户调整正在处理或结果待确认，请先核实原请求。'); return false }
onBeforeRouteLeave(allowNavigation)
onBeforeRouteUpdate((to) => to.query.userId === route.query.userId || allowNavigation())
function beforeUnload(event: BeforeUnloadEvent) { if (blocked.value) { event.preventDefault(); event.returnValue = '' } }
window.addEventListener('beforeunload', beforeUnload)
onBeforeUnmount(() => { sequence++; aiSequence++; window.removeEventListener('beforeunload', beforeUnload) })
watch(() => route.query.userId, value => { if (!blocked.value) userId.value = queryUser(value) })
watch(userId, () => { page.value = 1; aiPage.value = 1; reason.value = ''; adjustError.value = ''; rewardDialog.value = false; void router.replace({ query: { ...route.query, userId: userId.value ? String(userId.value) : undefined } }); void refreshAll() }, { immediate: true })
</script>
<style scoped>
.accounts { padding: 20px; display: grid; gap: 16px; min-width: 0; }
.page-header,.toolbar,.card-heading,.balance-detail,.dialog-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.page-header,.card-heading { justify-content: space-between; } h2 { margin: 0 0 6px; font-size: 22px; } p { margin: 0; font-size: 13px; line-height: 1.7; color: var(--el-text-color-secondary); }
.user-select { width: min(100%, 360px); } .account-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; }.balance { display: flex; align-items: baseline; gap: 12px; margin: 8px 0 12px; }.balance strong { font-size: 30px; overflow-wrap: anywhere; }.balance span,.muted,.balance-detail { font-size: 12px; color: var(--el-text-color-secondary); }.balance-detail { justify-content: space-between; }.balance-detail b { color: var(--el-text-color-primary); margin-left: 6px; }.positive { color: var(--el-color-success); }.negative { color: var(--el-color-danger); }.el-pagination { margin-top: 16px; overflow-x: auto; }.el-alert { margin: 10px 0; }.dialog-actions { justify-content: flex-end; margin-top: 16px; }
@media(max-width:760px) { .accounts { padding: 12px; }.account-grid { grid-template-columns: 1fr; }.page-header { align-items: flex-start; } }
</style>
