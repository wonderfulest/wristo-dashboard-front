<template>
  <div class="points-settings">
    <h2>小程序任务与积分兑换</h2>
    <p>使用统一奖励积分兑换表盘权益。每款表盘须单独开启，默认关闭。</p>
    <el-card shadow="never" v-loading="rewardsLoading">
      <template #header>任务奖励积分</template>
      <el-alert v-if="rewardsError" :title="rewardsError" type="error" :closable="false" />
      <el-form v-if="rewards" label-position="top" :disabled="rewardsSaving || rewardsLoading" class="reward-form">
        <el-form-item v-for="field in rewardFields" :key="field.key" :label="field.label">
          <el-input-number v-model="rewards[field.key]" :min="1" :max="100000" :precision="0" />
          <small>{{ field.description }}</small>
        </el-form-item>
      </el-form>
      <el-button type="primary" :loading="rewardsSaving" :disabled="!rewards || rewardsLoading" @click="saveRewards">保存任务奖励</el-button>
      <el-button :disabled="rewardsSaving" @click="loadRewards">刷新</el-button>
    </el-card>
    <el-card shadow="never" v-loading="loading">
      <template #header>全局默认兑换积分</template>
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <el-form v-if="settings" label-position="top" :disabled="saving || loading">
        <el-form-item label="默认所需积分"><el-input-number v-model="settings.defaultPoints" :min="1" :max="100000" :precision="0" /></el-form-item>
        <el-button type="primary" :loading="saving" @click="save">保存默认值</el-button>
      </el-form>
      <el-button @click="load" :disabled="saving">刷新</el-button>
      <p>仅影响使用全局默认值的表盘，单独设置的积分和历史兑换记录不变。</p>
    </el-card>
    <el-card shadow="never"><template #header>设置表盘兑换渠道</template><AppSearchSelect v-model="appId" placeholder="选择表盘" width="100%" style="max-width: 480px" /></el-card>
    <AppPointsSettings v-if="appId" :key="`${appId}-${version}`" :app-id="appId" />
    <el-card shadow="never" v-loading="resourcesLoading">
      <template #header>资源兑换积分</template>
      <el-alert v-if="resourcesError" :title="resourcesError" type="error" :closable="false" />
      <el-table :data="resources" empty-text="暂无可配置的兑换资源">
        <el-table-column prop="name" label="资源名称" min-width="180" />
        <el-table-column label="兑换状态" width="100"><template #default="{ row }">{{ row.enabled ? '已开放' : '未开放' }}</template></el-table-column>
        <el-table-column label="所需积分" min-width="180"><template #default="{ row }"><el-input-number v-model="row.points" :min="1" :max="100000" :precision="0" :disabled="resourceSaving !== null" /></template></el-table-column>
        <el-table-column label="操作" width="100"><template #default="{ row }"><el-button type="primary" :loading="resourceSaving === row.id" :disabled="resourceSaving !== null" @click="saveResource(row)">保存</el-button></template></el-table-column>
      </el-table>
      <el-button :disabled="resourceSaving !== null" @click="loadResources">刷新资源</el-button>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import AppPointsSettings from '@/components/AppPointsSettings.vue'
import { getPointsSettings, savePointsSettings, getPointsRewards, savePointsRewards, getPointsResources, savePointsResource, type PointsSettings, type PointsRewards, type PointsResource } from '@/api/miniappPoints'
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
const rewardFields: { key: keyof PointsRewards; label: string; description: string }[] = [
  { key: 'loginPoints', label: '首次登录', description: '每位用户一次' },
  { key: 'tutorialPoints', label: '新手教程', description: '完成教程，每位用户一次' },
  { key: 'firstInstallPoints', label: '首次安装表盘', description: '每位用户一次' },
  { key: 'checkInPoints', label: '每日签到', description: '每天一次' },
  { key: 'dailyInstallPoints', label: '每日安装表盘', description: '每天一次' },
  { key: 'weeklyInstallPoints', label: '每周安装 3 次', description: '每周一次' },
  { key: 'weeklyCheckIn3Points', label: '每周签到 3 天', description: '每周一次，可与其他签到奖励叠加' },
  { key: 'weeklyCheckIn5Points', label: '每周签到 5 天', description: '每周一次，可与其他签到奖励叠加' },
  { key: 'weeklyCheckInFullPoints', label: '每周签到全勤', description: '每周签到 7 天' },
  { key: 'weeklyInstallFullPoints', label: '每周安装全勤', description: '每周 7 天均安装成功' },
  { key: 'adPoints', label: '完整观看广告', description: '每次奖励，每天最多 3 次' },
]
const resources = ref<PointsResource[]>([]), resourcesLoading = ref(false), resourcesError = ref('')
const resourceSaving = ref<number | null>(null)
const validPoints = (value: number) => Number.isInteger(value) && value >= 1 && value <= 100000
async function loadRewards() {
  rewardsLoading.value = true; rewardsError.value = ''; rewards.value = undefined
  try {
    const response = await getPointsRewards()
    if (response.code !== 0 || !response.data) throw new Error()
    rewards.value = response.data
  } catch { rewardsError.value = '无法读取任务奖励，请刷新重试。' }
  finally { rewardsLoading.value = false }
}
async function saveRewards() {
  if (!rewards.value || rewardsSaving.value) return
  if (rewardFields.some(field => !validPoints(rewards.value![field.key]))) {
    ElMessage.warning('任务奖励须为 1 至 100000 的整数'); return
  }
  rewardsSaving.value = true; rewardsError.value = ''
  try {
    const response = await savePointsRewards({ ...rewards.value })
    if (response.code !== 0 || !response.data) throw new Error()
    rewards.value = response.data; ElMessage.success('已保存，后续任务按新额度发放')
  } catch { rewardsError.value = '未能确认保存结果，请刷新核对任务奖励后重试。' }
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
onMounted(() => { void load(); void loadRewards(); void loadResources() })
</script>
<style scoped>.reward-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0 24px; } small { display: block; width: 100%; color: var(--el-text-color-secondary); } .points-settings { padding: 24px; display: flex; flex-direction: column; gap: 20px; } h2,p { margin: 0; } p { color: var(--el-text-color-secondary); line-height: 1.6; }@media (max-width: 600px) { .points-settings { padding: 12px; } .points-settings :deep(.el-input-number) { width: 100%; } }</style>
