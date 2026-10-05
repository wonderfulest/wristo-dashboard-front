<template>
  <div class="rewards-page" v-loading="loading">
    <header><div><h2>用户积分任务</h2><p>奖励发放至用户的 Studio 积分余额；修改额度只影响后续发放。</p></div><el-button @click="load" :disabled="saving">刷新</el-button></header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-form v-if="settings" label-width="130px" :disabled="saving || loading">
      <el-card shadow="never">
        <template #header>每日签到</template>
        <el-form-item label="启用奖励"><el-switch v-model="settings.checkInEnabled" /></el-form-item>
        <el-form-item label="每日奖励积分"><el-input-number v-model="settings.checkInCredits" :min="1" :max="10000" :precision="0" /></el-form-item>
        <p>按北京时间，每位用户每天主动签到领取一次。</p>
      </el-card>
      <el-card shadow="never">
        <template #header>购买奖励</template>
        <el-form-item label="启用奖励"><el-switch v-model="settings.purchaseEnabled" /></el-form-item>
        <el-form-item label="每笔奖励积分"><el-input-number v-model="settings.purchaseCredits" :min="1" :max="10000" :precision="0" /></el-form-item>
        <p>有效支付成功后，按订单邮箱关联已验证用户。同一支付交易只奖励一次；零金额和赠送订单不计入。同一交易发生退款即撤回原奖励，关闭开关后仍处理退款。</p>
      </el-card>
      <el-card shadow="never">
        <template #header>首次下载</template>
        <el-form-item label="启用奖励"><el-switch v-model="settings.downloadEnabled" /></el-form-item>
        <el-form-item label="每次奖励积分"><el-input-number v-model="settings.downloadCredits" :min="1" :max="10000" :precision="0" /></el-form-item>
        <el-form-item label="每日积分上限"><el-input-number v-model="settings.downloadDailyLimit" :min="1" :max="10000" :precision="0" /></el-form-item>
        <p>用户登录后在商店点击下载即可获得奖励，免费表盘也计入。同一用户、同一表盘只奖励一次；每日剩余额度不足一次奖励时，当天不再发放。此任务记录下载点击，不代表已安装到手表。</p>
      </el-card>
      <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
      <el-button @click="openHistory">修改历史</el-button>
    </el-form>
    <el-drawer v-model="historyVisible" title="用户积分任务 · 修改历史" size="min(800px, 96vw)">
      <el-alert v-if="historyError" :title="historyError" type="error" :closable="false" />
      <el-table :data="histories" v-loading="historyLoading">
        <el-table-column prop="updatedBy" label="操作人" width="130" />
        <el-table-column prop="createdAt" label="时间" width="180" />
        <el-table-column label="配置变更"><template #default="{ row }"><details><summary>查看</summary><p>旧配置</p><pre>{{ row.oldValue || '默认配置' }}</pre><p>新配置</p><pre>{{ row.newValue }}</pre></details></template></el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserRewards, saveUserRewards, type UserRewardSettings } from '@/api/userRewards'
import { getConfigHistory } from '@/api/config'
import type { GlobalConfigHistory } from '@/types/ops'
const settings = ref<UserRewardSettings>()
const loading = ref(false), saving = ref(false), error = ref('')
const historyVisible = ref(false), historyLoading = ref(false), historyError = ref('')
const histories = ref<GlobalConfigHistory[]>([])
async function load() {
  loading.value = true; error.value = ''; settings.value = undefined
  try {
    const response = await getUserRewards()
    if (response.code !== 0 || !response.data) throw new Error()
    settings.value = { ...response.data }
  } catch { error.value = '无法读取用户任务配置，请刷新重试。' }
  finally { loading.value = false }
}
async function save() {
  if (!settings.value || saving.value) return
  const s = settings.value
  if ([s.checkInCredits, s.purchaseCredits, s.downloadCredits, s.downloadDailyLimit].some(n => !Number.isInteger(n) || n < 1 || n > 10000)) {
    ElMessage.warning('积分和每日上限须为 1 至 10000 的整数'); return
  }
  if (s.downloadEnabled && s.downloadDailyLimit < s.downloadCredits) {
    ElMessage.warning('每日上限不能低于单次下载奖励'); return
  }
  saving.value = true; error.value = ''
  try {
    const response = await saveUserRewards({ ...s })
    if (response.code !== 0 || !response.data) throw new Error()
    settings.value = { ...response.data }; ElMessage.success('已保存，后续奖励按新额度发放')
  } catch { error.value = '未能确认保存结果，请刷新核对配置后重试。' }
  finally { saving.value = false }
}
async function openHistory() {
  historyVisible.value = true; historyLoading.value = true; historyError.value = ''; histories.value = []
  try {
    const response = await getConfigHistory('studio.user.rewards', 'business')
    if (response.code !== 0 || !response.data) throw new Error()
    histories.value = response.data
  } catch { historyError.value = '无法加载修改历史。' }
  finally { historyLoading.value = false }
}
onMounted(load)
</script>
<style scoped>
.rewards-page { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
h2 { margin: 0 0 8px; }
p { color: var(--el-text-color-secondary); line-height: 1.6; font-size: 13px; }
.el-card { margin-bottom: 20px; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
