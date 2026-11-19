<template>
  <div class="points-settings">
    <h2>{{ mode === 'rewards' ? '小程序任务' : '小程序兑换' }}</h2>
    <p v-if="mode === 'redemptions'">国内网站和微信小程序使用统一积分兑换表盘权益。付费和免费表盘默认开启兑换，付费按人民币售价 × 10，免费默认 50 积分。每款表盘可单独调整，开启后所需积分必须大于 0；会员权益覆盖和已拥有的表盘不扣积分。</p>
    <el-card v-if="mode === 'rewards'" shadow="never" v-loading="rewardsLoading">
      <template #header>
        <div class="rewards-header">
          <span>任务积分</span>
          <el-tag v-if="weeklyRewardSummary" size="large">每日任务可得 {{ weeklyRewardSummary.dailyTotal }} 积分</el-tag>
          <el-tag v-if="weeklyRewardSummary" type="success" size="large">整周任务可得 {{ weeklyRewardSummary.total }} 积分</el-tag>
        </div>
      </template>
      <div class="weekly-summary">
        <p v-if="weeklyRewardSummary">每日任务 × 7 天：{{ weeklyRewardSummary.daily }} 积分 + 每周奖励：{{ weeklyRewardSummary.weekly }} 积分</p>
        <p v-else>部分任务不限领取次数，无法计算固定的整周积分上限。</p>
        <small>按当前表单中的开启状态、每次积分和领取次数估算，修改后需保存才生效；不含每账号任务、自定义任务及 AI 点数。任务仍需满足完成条件。</small>
      </div>
      <el-alert v-if="rewardsError" :title="rewardsError" type="error" :closable="false" />
      <el-form v-if="rewards" label-position="top">
        <el-form-item label="视频补签">
          <el-switch v-model="rewards.makeupEnabled" active-text="开启" inactive-text="关闭" :disabled="rewardsSaving || rewardsLoading" />
          <el-button :loading="rewardsSaving" :disabled="rewardsLoading || rewardsUncertain" @click="saveRewards">保存补签设置</el-button>
          <small>观看视频补签本周漏签日期；已有进度保留。签到任务关闭时补签同步暂停。</small>
        </el-form-item>
        <PointsTaskFields v-for="task in tasks" :key="task.key" :task="task" :period="task.period" :fixed="task.fixed" :claim-cap="task.claimCap"
          :disabled="rewardsSaving || rewardsLoading || rewardsUncertain" @toggle="toggleTask(task, $event)" @save="saveTask(task)" />
      </el-form>
      <el-button :disabled="rewardsSaving || rewardsLoading" @click="loadRewards">刷新任务配置</el-button>
    </el-card>
    <ManualPointsTasks v-if="mode === 'rewards'" />
    <template v-if="mode === 'redemptions'">
    <el-card shadow="never" v-loading="loading">
      <template #header>免费表盘默认兑换积分</template>
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <el-form v-if="settings" label-position="top" :disabled="saving || loading">
        <el-form-item label="默认所需积分"><el-input-number v-model="settings.defaultPoints" :min="1" :max="100000" :precision="0" /></el-form-item>
        <el-button type="primary" :loading="saving" @click="save">保存默认值</el-button>
      </el-form>
      <el-button @click="load" :disabled="saving">刷新</el-button>
      <p>仅影响使用默认值的免费表盘；付费表盘按人民币售价 × 10 计算，单独设置的积分和历史兑换记录不变。</p>
    </el-card>
    <el-card shadow="never"><template #header>设置表盘兑换渠道</template><AppSearchSelect v-model="appId" width="100%" style="max-width: 480px" /></el-card>
    <AppPointsSettings v-if="appId" :key="`${appId}-${version}`" :app-id="appId" />
    <el-card shadow="never" v-loading="resourcesLoading">
      <template #header>资源兑换积分</template>
      <el-alert v-if="resourcesError" :title="resourcesError" type="error" :closable="false" />
      <el-table :data="resources" empty-text="暂无可配置的兑换资源">
        <TableActionColumn><template #default="{ row }"><el-button type="primary" :loading="resourceSaving === row.id" :disabled="resourceSaving !== null" @click="saveResource(row)">保存</el-button></template></TableActionColumn>

        <el-table-column prop="name" label="资源名称" min-width="180" />
        <el-table-column label="兑换状态" width="100"><template #default="{ row }">{{ row.enabled ? '已开放' : '未开放' }}</template></el-table-column>
        <el-table-column label="所需积分" min-width="180"><template #default="{ row }"><el-input-number v-model="row.points" :min="1" :max="100000" :precision="0" :disabled="resourceSaving !== null" /></template></el-table-column>
      </el-table>
      <el-button :disabled="resourceSaving !== null" @click="loadResources">刷新资源</el-button>
    </el-card>
    </template>
  </div>
</template>
<script setup lang="ts">
import ManualPointsTasks from '@/components/ManualPointsTasks.vue'
import PointsTaskFields from '@/components/PointsTaskFields.vue'
import { getPointsTasks, savePointsTask, savePointsMakeup, type PointsTaskConfig } from '@/api/miniappPoints'
import TableActionColumn from '@/components/common/TableActionColumn.vue'
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import AppPointsSettings from '@/components/AppPointsSettings.vue'
import { getPointsSettings, savePointsSettings, getPointsRewards, getPointsResources, savePointsResource, type PointsSettings, type PointsRewards, type PointsResource } from '@/api/miniappPoints'
const { mode = 'rewards' } = defineProps<{ mode?: 'rewards' | 'redemptions' }>()
const settings = ref<PointsSettings>(), appId = ref<number | null>(), version = ref(0)
const loading = ref(false), saving = ref(false), error = ref('')
async function load() {
  loading.value = true; error.value = ''; settings.value = undefined
  try { const r = await getPointsSettings(); if (r.code !== 0 || !r.data) throw new Error(); settings.value = r.data }
  catch { error.value = '无法读取默认积分，请刷新重试。' }
  finally { loading.value = false }
}
async function save() {
  if (!settings.value || saving.value) return
  const n = settings.value.defaultPoints
  if (!Number.isInteger(n) || n < 1 || n > 100000) { ElMessage.warning('积分须为 1 至 100000 的整数'); return }
  saving.value = true; error.value = ''
  try { const r = await savePointsSettings({ defaultPoints: n }); if (r.code !== 0 || !r.data) throw new Error(); settings.value = r.data; version.value++; ElMessage.success('默认积分已保存') }
  catch { error.value = '未能确认保存结果，请刷新核对后重试。' }
  finally { saving.value = false }
}
const rewards = ref<PointsRewards>()
const rewardsLoading = ref(false), rewardsSaving = ref(false), rewardsError = ref('')
const tasks = ref<PointsTaskConfig[]>([])
const savedTasks = ref(new Map<string, PointsTaskConfig>())
const rewardsUncertain = ref(false)
const resources = ref<PointsResource[]>([]), resourcesLoading = ref(false), resourcesError = ref('')
const resourceSaving = ref<number | null>(null)
const validPoints = (value: number) => Number.isInteger(value) && value >= 1 && value <= 100000
const weeklyRewardSummary = computed(() => {
  if (!tasks.value.length) return null
  const active = tasks.value.filter(task => task.enabled && task.period !== 'ACCOUNT')
  if (active.some(task => !validPoints(task.points) || !Number.isInteger(task.maxClaims) || task.maxClaims <= 0)) return null
  const daily = active.filter(task => task.period === 'DAY').reduce((sum, task) => sum + task.points * task.maxClaims * 7, 0)
  const weekly = active.filter(task => task.period === 'WEEK').reduce((sum, task) => sum + task.points * task.maxClaims, 0)
  return { dailyTotal: daily / 7, daily, weekly, total: daily + weekly }
})
async function loadRewards() {
  if (rewardsLoading.value || rewardsSaving.value) return
  rewardsLoading.value = true; rewardsError.value = ''; rewards.value = undefined; tasks.value = []
  try {
    const [response, taskResponse] = await Promise.all([getPointsRewards(), getPointsTasks()])
    if (response.code !== 0 || !response.data || taskResponse.code !== 0 || !taskResponse.data) throw new Error()
    rewards.value = response.data; tasks.value = taskResponse.data
    savedTasks.value = new Map(tasks.value.map(task => [task.key, { ...task }]))
    rewardsUncertain.value = false
  } catch { rewardsError.value = '无法读取任务配置，请刷新重试。' }
  finally { rewardsLoading.value = false }
}
async function saveTask(task: PointsTaskConfig, enabled?: boolean) {
  if (rewardsSaving.value || rewardsLoading.value || rewardsUncertain.value || task.fixed) return
  // A switch only changes the last saved configuration; other draft fields stay untouched.
  const input = enabled === undefined ? { ...task } : { ...savedTasks.value.get(task.key)!, enabled }
  if (!input.name?.trim() || input.name.length > 120 || input.description.length > 2000 || !validPoints(input.points)
      || !Number.isInteger(input.maxClaims) || input.maxClaims < (input.claimCap === 1 ? 1 : 0) || input.maxClaims > (input.claimCap || 100000)) {
    ElMessage.warning('请检查标题、说明、积分及领取次数'); return
  }
  rewardsSaving.value = true; rewardsError.value = ''
  try {
    const response = await savePointsTask({ ...input, name: input.name.trim(), description: input.description.trim() })
    if (response.code !== 0 || !response.data) throw new Error()
    savedTasks.value.set(task.key, { ...response.data })
    if (enabled === undefined) Object.assign(task, response.data)
    else task.enabled = response.data.enabled
    ElMessage.success('任务配置已保存')
  } catch { rewardsUncertain.value = true; rewardsError.value = '未能确认保存结果，请刷新核对任务配置后重试。' }
  finally { rewardsSaving.value = false }
}
function toggleTask(task: PointsTaskConfig, enabled: boolean) { return saveTask(task, enabled) }
async function saveRewards() {
  if (!rewards.value || rewardsSaving.value || rewardsLoading.value || rewardsUncertain.value) return
  rewardsSaving.value = true; rewardsError.value = ''
  try {
    const response = await savePointsMakeup(rewards.value.makeupEnabled)
    if (response.code !== 0 || !response.data) throw new Error()
    rewards.value.makeupEnabled = response.data.enabled; ElMessage.success('补签设置已保存')
  } catch { rewardsUncertain.value = true; rewardsError.value = '未能确认保存结果，请刷新核对补签设置后重试。' }
  finally { rewardsSaving.value = false }
}
async function loadResources() {
  resourcesLoading.value = true; resourcesError.value = ''; resources.value = []
  try {
    const response = await getPointsResources()
    if (response.code !== 0 || !response.data) throw new Error()
    resources.value = response.data
  } catch { resourcesError.value = '无法读取资源兑换积分，请刷新重试。' }
  finally { resourcesLoading.value = false }
}
async function saveResource(resource: PointsResource) {
  if (resourceSaving.value !== null) return
  if (!validPoints(resource.points)) { ElMessage.warning('兑换积分须为 1 至 100000 的整数'); return }
  resourceSaving.value = resource.id; resourcesError.value = ''
  try {
    const response = await savePointsResource(resource.id, resource.points)
    if (response.code !== 0 || !response.data) throw new Error()
    Object.assign(resource, response.data); ElMessage.success('资源兑换积分已保存')
  } catch { resourcesError.value = '未能确认保存结果，请刷新核对资源积分后重试。' }
  finally { resourceSaving.value = null }
}
onMounted(() => { if (mode === 'rewards') void loadRewards(); else { void load(); void loadResources() } })
</script>
<style scoped>.rewards-header { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; } .weekly-summary { margin-bottom: 20px; padding: 12px 16px; background: var(--el-fill-color-light); border-radius: 6px; } .reward-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0 24px; } small { display: block; width: 100%; color: var(--el-text-color-secondary); } .points-settings { padding: 24px; display: flex; flex-direction: column; gap: 20px; } h2,p { margin: 0; } p { color: var(--el-text-color-secondary); line-height: 1.6; }@media (max-width: 600px) { .points-settings { padding: 12px; } .points-settings :deep(.el-input-number) { width: 100%; } }</style>
