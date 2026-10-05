<template>
  <div class="rewards-page" v-loading="loading">
    <header>
      <div><h2>创作者积分奖励</h2><p>每天北京时间 02:00 结算前一天及遗漏的未结算记录，奖励发放至创作者的 Studio 积分账户。</p></div>
      <div class="actions">
        <el-button :disabled="loading || saving" @click="load">刷新</el-button>
        <el-button :disabled="loading || saving" @click="openHistory">修改历史</el-button>
        <el-button type="primary" :loading="saving" :disabled="loading || !settings" @click="save">保存配置</el-button>
      </div>
    </header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <template v-if="settings">
      <el-card shadow="never">
        <template #header><strong>下载奖励</strong></template>
        <el-form label-width="140px" :disabled="saving">
          <el-form-item label="启用下载奖励"><el-switch v-model="settings.downloadEnabled" /></el-form-item>
          <el-form-item label="累计下载次数"><el-input-number v-model="settings.downloadsPerReward" :min="1" :max="10000" :precision="0" /><span class="unit">次</span></el-form-item>
          <el-form-item label="每满门槛奖励"><el-input-number v-model="settings.downloadCredits" :min="1" :max="10000" :precision="0" /><span class="unit">积分</span></el-form-item>
        </el-form>
        <p>同一创作者的应用合并累计，未满门槛的次数跨天保留。按设备首次上报记录计次，免费应用同样计入，测试和支付占位记录不计入。当前尚未接入安装真实性校验。</p>
      </el-card>
      <el-card shadow="never">
        <template #header><strong>购买奖励</strong></template>
        <el-form label-width="140px" :disabled="saving">
          <el-form-item label="启用购买奖励"><el-switch v-model="settings.purchaseEnabled" /></el-form-item>
          <el-form-item label="每次成功购买"><el-input-number v-model="settings.purchaseCredits" :min="1" :max="10000" :precision="0" /><span class="unit">积分</span></el-form-item>
        </el-form>
        <p>仅计入成功支付的单应用订单，赠送、未付款、积分兑换和套餐订单不计入；已付款购物车按其中的应用分别计次。订单退款后在日结时撤回原奖励，关闭购买奖励也会继续处理退款。</p>
      </el-card>
      <el-alert title="修改从下一批日结生效；同一结算日重试沿用首次执行时的配置。关闭期间已结算的记录不补发，已有下载余数保留。" type="info" :closable="false" show-icon />
    </template>
    <el-card v-if="view" shadow="never">
      <template #header><strong>结算状态</strong></template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="开始计入时间">{{ formatTime(view.settlement.startedAt) }}（此前记录不补发）</el-descriptions-item>
        <el-descriptions-item label="最近结算至">{{ view.settlement.lastSettledDay || '尚未结算' }}</el-descriptions-item>
        <el-descriptions-item label="任务状态">{{ view.job.running ? '运行中' : statuses[view.job.status] || view.job.status }}</el-descriptions-item>
      </el-descriptions>
      <el-alert v-if="view.job.failure" title="最近一次结算失败，任务会自动重试。" type="warning" :closable="false" show-icon />
    </el-card>
    <el-drawer v-model="historyVisible" title="创作者奖励 · 修改历史" size="min(800px, 96vw)">
      <el-alert v-if="historyError" :title="historyError" type="error" :closable="false" />
      <el-table :data="histories" v-loading="historyLoading">
        <el-table-column prop="updatedBy" label="操作人" width="130" />
        <el-table-column prop="createdAt" label="时间" width="180" />
        <el-table-column label="变更"><template #default="{ row }"><details><summary>查看配置</summary><p>旧配置</p><pre>{{ row.oldValue || '默认配置' }}</pre><p>新配置</p><pre>{{ row.newValue }}</pre></details></template></el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getCreatorRewards, saveCreatorRewards, type CreatorRewardSettings, type CreatorRewardView } from '@/api/creatorRewards'
import { getConfigHistory } from '@/api/config'
import type { GlobalConfigHistory } from '@/types/ops'
const settings = ref<CreatorRewardSettings>()
const view = ref<CreatorRewardView>()
const loading = ref(false), saving = ref(false), error = ref('')
const historyVisible = ref(false), historyLoading = ref(false), historyError = ref('')
const histories = ref<GlobalConfigHistory[]>([])
const statuses: Record<string, string> = { IDLE: '尚未运行', RUNNING: '运行中', SUCCESS: '成功', FAILED: '失败，等待重试' }
const formatTime = (value: string) => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
function apply(data: CreatorRewardView) { view.value = data; settings.value = { ...data.settings } }
async function load() {
  loading.value = true; error.value = ''; settings.value = undefined; view.value = undefined
  try {
    const response = await getCreatorRewards()
    if (response.code !== 0 || !response.data) throw new Error()
    apply(response.data)
  } catch { error.value = '无法读取奖励配置，请刷新后重试。' }
  finally { loading.value = false }
}
async function save() {
  if (!settings.value || saving.value) return
  if ([settings.value.downloadsPerReward, settings.value.downloadCredits, settings.value.purchaseCredits].some(n => !Number.isInteger(n) || n < 1 || n > 10000)) {
    ElMessage.warning('下载次数和奖励积分须为 1 至 10000 的整数'); return
  }
  saving.value = true; error.value = ''
  try {
    const response = await saveCreatorRewards({ ...settings.value })
    if (response.code !== 0 || !response.data) throw new Error()
    apply(response.data); ElMessage.success('奖励配置已保存，下一批日结生效')
  } catch { error.value = '未能确认保存结果，请刷新核对配置后重试。' }
  finally { saving.value = false }
}
async function openHistory() {
  historyVisible.value = true; historyLoading.value = true; historyError.value = ''; histories.value = []
  try {
    const response = await getConfigHistory('studio.creator.rewards', 'business')
    if (response.code !== 0 || !response.data) throw new Error()
    histories.value = response.data
  } catch { historyError.value = '无法加载修改历史。' }
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
