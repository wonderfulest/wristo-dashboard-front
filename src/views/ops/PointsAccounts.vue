<template>
  <div class="accounts">
    <h2>积分账户</h2>
    <p>奖励积分用于权益兑换，AI 点数用于 AI 功能。两类余额独立管理。</p>
    <el-card shadow="never">
      <UserSelect v-model="userId" placeholder="搜索用户" :disabled="saving || !!pending" style="width: min(100%, 480px)" />
      <el-button :disabled="!userId || saving || !!pending" @click="aiDialog?.open(userId)">管理 AI 点数</el-button>
      <el-button :disabled="!userId || loading || saving" @click="load">刷新</el-button>
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <template v-if="userId">
        <div v-loading="loading" class="balances"><span>奖励积分可用余额 <strong>{{ account?.available ?? '—' }}</strong></span><span>待补足欠额 <strong>{{ account?.debt ?? '—' }}</strong></span><span>净余额 <strong>{{ account?.balance ?? '—' }}</strong></span></div>
        <el-form label-position="top" @submit.prevent="submit">
          <el-form-item label="调整数量（正数增加，负数扣减）"><el-input-number v-model="delta" :min="-1000000" :max="1000000" :precision="0" :disabled="saving || !!pending" /></el-form-item>
          <el-form-item label="调整原因（必填）"><el-input v-model="reason" type="textarea" maxlength="180" show-word-limit :disabled="saving || !!pending" /></el-form-item>
          <el-alert v-if="pending" title="提交结果尚未确认，请使用原请求重试。重复请求不会重复入账。" type="warning" :closable="false" />
          <el-button type="primary" native-type="submit" :loading="saving" :disabled="loading || (!account && !pending)">{{ pending ? '重试确认结果' : '调整奖励积分' }}</el-button>
        </el-form>
        <h3>奖励积分流水</h3>
        <el-table :data="entries" v-loading="loading" empty-text="暂无流水">
          <el-table-column label="时间" min-width="170"><template #default="{row}">{{ row.createdAt }}</template></el-table-column>
          <el-table-column prop="delta" label="变动" width="100" />
          <el-table-column prop="description" label="说明" min-width="180" />
          <el-table-column prop="eventKey" label="来源编号" min-width="180" show-overflow-tooltip />
        </el-table>
        <el-pagination v-model:current-page="page" :total="total" :page-size="20" layout="total, prev, pager, next" :disabled="loading || saving" @current-change="load" />
      </template>
    </el-card>
    <StudioCreditsDialog ref="aiDialog" />
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserSelect from '@/components/users/UserSelect.vue'
import StudioCreditsDialog from '@/components/users/StudioCreditsDialog.vue'
import { getRewardAccount, getRewardHistory, adjustRewardPoints, type RewardAccount, type RewardEntry, type RewardAdjustment } from '@/api/rewardPoints'
const userId = ref<number>(), account = ref<RewardAccount>(), entries = ref<RewardEntry[]>([])
const page = ref(1), total = ref(0), loading = ref(false), saving = ref(false), error = ref('')
const delta = ref(1), reason = ref(''), pending = ref<{id: number; body: RewardAdjustment}>()
const aiDialog = ref<InstanceType<typeof StudioCreditsDialog>>()
let sequence = 0
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
  } catch { if (ticket === sequence) error.value = '无法加载账户，请刷新重试。' }
  finally { if (ticket === sequence) loading.value = false }
}
async function submit() {
  if (saving.value || !userId.value) return
  if (!pending.value) {
    if (!Number.isInteger(delta.value) || !delta.value || Math.abs(delta.value) > 1000000 || !reason.value.trim() || reason.value.trim().length > 180) { ElMessage.warning('请填写非零整数和调整原因'); return }
    const id = userId.value, body = { delta: delta.value, reason: reason.value.trim(), idempotencyKey: crypto.randomUUID() }
    saving.value = true
    try { await ElMessageBox.confirm(`用户 ${id} 的奖励积分将${body.delta > 0 ? '增加' : '扣减'} ${Math.abs(body.delta)}，原因：${body.reason}`, '确认调整') }
    catch { saving.value = false; return }
    pending.value = { id, body }
  }
  saving.value = true; error.value = ''
  try {
    const r = await adjustRewardPoints(pending.value.id, pending.value.body)
    if (r.code !== 0 || !r.data) throw new Error()
    pending.value = undefined; reason.value = ''; ElMessage.success('奖励积分已调整'); await load()
  } catch (cause: unknown) {
    const failure = cause as { code?: number; msg?: string; response?: { status?: number; data?: { msg?: string } } }
    const code = failure.response?.status ?? failure.code
    if (typeof code === 'number' && code >= 400 && code < 500) {
      pending.value = undefined
      error.value = failure.msg || failure.response?.data?.msg || '调整未获批准，请核对账户和原因。'
    } else error.value = '未能确认调整结果，请使用原请求重试。'
  }
  finally { saving.value = false }
}
watch(userId, () => { page.value = 1; void load() })
</script>
<style scoped>
.accounts { padding: 24px; display: grid; gap: 18px; } h2,p { margin: 0; } p { color: var(--el-text-color-secondary); } .balances { display: flex; flex-wrap: wrap; gap: 28px; padding: 24px 0; } strong { display: block; font-size: 26px; margin-top: 8px; } .el-alert { margin: 16px 0; } .el-pagination { margin-top: 16px; } @media (max-width: 600px) { .accounts { padding: 12px; } }
</style>
