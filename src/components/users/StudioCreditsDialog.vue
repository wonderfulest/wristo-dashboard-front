<template>
  <el-dialog v-model="visible" title="用户积分管理" width="min(900px, 95vw)" :close-on-click-modal="false" :close-on-press-escape="!submitting" :show-close="!submitting">
    <el-form label-width="90px" @submit.prevent="submit">
      <el-form-item label="用户"><UserSelect v-model="userId" placeholder="搜索用户名或邮箱" :disabled="submitting || uncertain" style="width: 100%" /></el-form-item>
      <template v-if="userId">
        <el-alert v-if="loadError" :title="loadError" type="error" :closable="false" show-icon />
        <el-form-item label="当前余额"><strong>{{ balance == null ? '—' : balance.toLocaleString('zh-CN') }} 积分</strong><el-button link type="primary" :disabled="submitting || loading" @click="refresh">刷新</el-button></el-form-item>
        <el-form-item label="操作"><el-radio-group v-model="form.direction" :disabled="submitting || uncertain" @change="changeDirection"><el-radio-button value="ADD">充值</el-radio-button><el-radio-button value="REMOVE">扣减</el-radio-button></el-radio-group></el-form-item>
        <el-form-item label="积分数量" required><el-input-number v-model="form.amount" :min="1" :max="1000000" :precision="0" :step="1" :disabled="submitting || uncertain" /><span class="hint">每次最多 1,000,000 积分</span></el-form-item>
        <el-form-item label="原因" required><el-select v-model="form.reason" :disabled="submitting || uncertain" style="width: 240px"><el-option v-for="key in reasonOptions" :key="key" :value="key" :label="reasons[key]" /></el-select></el-form-item>
        <el-form-item label="补充说明" :required="form.reason === 'OTHER'"><el-input v-model="form.note" type="textarea" :rows="2" maxlength="500" show-word-limit :disabled="submitting || uncertain" placeholder="选择其他时必须填写说明" /></el-form-item>
        <el-alert v-if="uncertain" title="上次提交结果未确认。请使用原请求重试核实，重试不会重复调整积分。" type="warning" :closable="false" show-icon />
        <el-form-item><el-button type="primary" native-type="submit" :loading="submitting" :disabled="loading || balance == null">{{ uncertain ? '重试确认结果' : form.direction === 'ADD' ? '确认充值' : '确认扣减' }}</el-button><span class="hint" v-if="balance != null && form.amount">调整后预计 {{ (balance + (form.direction === 'ADD' ? form.amount : -form.amount)).toLocaleString('zh-CN') }} 积分</span></el-form-item>
        <h3>积分流水</h3>
        <el-table :data="entries" max-height="320" v-loading="loading" empty-text="暂无积分流水">
          <el-table-column label="时间" min-width="165"><template #default="{ row }">{{ time(row.created_at) }}</template></el-table-column>
          <el-table-column label="类型 / 原因" min-width="160"><template #default="{ row }">{{ types[row.type] || row.type }}<div class="hint">{{ reasons[row.reason] || row.reason || '—' }}</div></template></el-table-column>
          <el-table-column label="变动" width="85"><template #default="{ row }"><span :class="row.delta > 0 ? 'positive' : 'negative'">{{ row.delta > 0 ? '+' : '' }}{{ row.delta }}</span></template></el-table-column>
          <el-table-column prop="balance_after" label="余额" width="95" />
          <el-table-column label="操作人" min-width="120"><template #default="{ row }">{{ row.operator_name || row.operator_id || '系统' }}</template></el-table-column>
          <el-table-column prop="note" label="说明" min-width="160" show-overflow-tooltip />
        </el-table>
        <el-pagination v-model:current-page="page" :total="total" :page-size="20" layout="total, prev, pager, next" :disabled="submitting || loading" @current-change="refresh" />
      </template>
    </el-form>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserSelect from '@/components/users/UserSelect.vue'
import { adjustCredits, getCreditAccount, getCreditHistory, type CreditAdjustment, type CreditEntry } from '@/api/studioCredits'
const visible = ref(false), userId = ref<number>(), balance = ref<number>(), page = ref(1), total = ref(0)
const entries = ref<CreditEntry[]>([]), loading = ref(false), submitting = ref(false), uncertain = ref(false), loadError = ref('')
const form = reactive({ direction: 'ADD' as 'ADD' | 'REMOVE', amount: 100, reason: 'RECHARGE', note: '' })
const reasons: Record<string, string> = { RECHARGE: '充值', PLATFORM_GIFT: '平台赠送', ACTIVITY_REWARD: '活动奖励', SERVICE_COMPENSATION: '服务补偿', REFUND_RECOVERY: '退款回收', CORRECTION: '误充值纠正', VIOLATION: '违规扣减', OTHER: '其他' }
const types: Record<string, string> = { SHARE_VISIT_REWARD: '分享访问奖励', USER_CHECK_IN: '每日签到', USER_DOWNLOAD: '首次下载奖励', USER_PURCHASE: '用户购买奖励', USER_PURCHASE_REFUND: '用户购买奖励撤回', CREATOR_DOWNLOAD: '创作者下载奖励', CREATOR_PURCHASE: '创作者购买奖励', CREATOR_PURCHASE_REFUND: '创作者购买奖励撤回', ADMIN_CREDIT: '管理员充值', ADMIN_DEBIT: '管理员扣减', REGISTRATION_GIFT: '注册赠送', AI_TAGS: 'AI 标签', AI_DESCRIPTION: 'AI 描述', AI_BANNER: 'Banner 图片', AI_WATCHFACE: 'AI 表盘', AI_WATCHFACE_ADJUST: '表盘局部调整', AI_WATCHFACE_REFUND: '表盘生成退款', AI_WATCHFACE_ADJUST_REFUND: '表盘调整退款' }
const reasonOptions = computed(() => form.direction === 'ADD' ? ['RECHARGE', 'PLATFORM_GIFT', 'ACTIVITY_REWARD', 'SERVICE_COMPENSATION', 'OTHER'] : ['REFUND_RECOVERY', 'CORRECTION', 'VIOLATION', 'OTHER'])
const time = (value: string) => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
let sequence = 0
let pending: { userId: number; data: CreditAdjustment } | undefined
function changeDirection() { form.reason = reasonOptions.value[0] }
async function refresh() {
  const request = ++sequence, id = userId.value
  if (!id) { balance.value = undefined; entries.value = []; total.value = 0; loading.value = false; return }
  loading.value = true; loadError.value = ''; balance.value = undefined; entries.value = []; total.value = 0
  try {
    const [account, history] = await Promise.all([getCreditAccount(id), getCreditHistory(id, page.value)])
    if (request !== sequence) return
    if (!account.data || !history.data) throw new Error('Missing credit response')
    balance.value = account.data.balance; entries.value = history.data.items; total.value = history.data.total
  } catch { if (request === sequence) loadError.value = '无法读取积分，请点击刷新重试。' }
  finally { if (request === sequence) loading.value = false }
}
watch(userId, () => { page.value = 1; void refresh() })
function open(id?: number) {
  if (pending) { visible.value = true; return }
  form.direction = 'ADD'; form.amount = 100; form.reason = 'RECHARGE'; form.note = ''; page.value = 1
  visible.value = true
  if (userId.value === id) void refresh()
  else userId.value = id
}
async function submit() {
  if (submitting.value || !userId.value || balance.value == null) return
  if (!pending) {
    if (!Number.isInteger(form.amount) || form.amount < 1 || form.amount > 1000000) { ElMessage.warning('请输入 1 至 1000000 的整数'); return }
    if (!reasonOptions.value.includes(form.reason) || (form.reason === 'OTHER' && !form.note.trim())) { ElMessage.warning('请填写调整原因'); return }
    if (form.direction === 'REMOVE' && form.amount > balance.value) { ElMessage.warning('用户积分余额不足'); return }
  }
  submitting.value = true
  try {
    if (!pending) {
      try { await ElMessageBox.confirm(`用户 ID：${userId.value}，${form.direction === 'ADD' ? '充值' : '扣减'} ${form.amount} 积分。原因：${reasons[form.reason]}${form.note.trim() ? '；' + form.note.trim() : ''}`, '确认积分调整', { confirmButtonText: '确认调整', cancelButtonText: '取消', type: 'warning' }) }
      catch { return }
      pending = { userId: userId.value, data: { ...form, note: form.note.trim(), requestId: crypto.randomUUID() } }
    }
    try {
      await adjustCredits(pending.userId, pending.data)
      pending = undefined; uncertain.value = false; form.note = ''; page.value = 1
      ElMessage.success('积分调整成功'); await refresh()
    } catch (error: any) {
      // Keep the exact request on network/server failures: the server may already have committed it.
      const status = error?.response?.status
      if ((typeof status === 'number' && status >= 400 && status < 500) || (typeof error?.code === 'number' && error.code >= 400 && error.code < 500)) { pending = undefined; uncertain.value = false }
      else uncertain.value = true
    }
  } finally { submitting.value = false }
}
defineExpose({ open })
</script>
<style scoped>
.hint{color:var(--el-text-color-secondary);font-size:12px;margin-left:8px}.positive{color:var(--el-color-success)}.negative{color:var(--el-color-danger)}.el-pagination{margin-top:16px}.el-alert{margin-bottom:16px}
</style>
