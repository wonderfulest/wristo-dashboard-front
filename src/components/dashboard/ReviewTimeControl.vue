<template>
  <el-card class="review-card" shadow="never" v-loading="loading">
    <template #header>
      <div class="card-header">
        <span class="card-title">应用上线审核时间</span>
        <span class="scope-tag">网站 · 微信小程序</span>
      </div>
    </template>

    <div class="review-body">
      <div class="current-box">
        <div class="label">当前审核时间</div>
        <div class="value" :class="{ mono: reviewTime, 'is-empty': !reviewTime }">{{ reviewTime || '未设置，最新上线仅展示免费应用' }}</div>
        <div class="meta">
          <span>最近修改人：{{ current?.updatedBy || '-' }}</span>
          <span>最近修改时间：{{ current?.updatedAt ? formatDateTime(current!.updatedAt) : '-' }}</span>
        </div>
      </div>
      <div class="refresh">
        <el-button class="refresh-btn" type="primary" :loading="refreshing" @click="onRefreshNow">
          刷新为当前时间
        </el-button>
        <span class="refresh-hint">依次执行下方三个步骤</span>
      </div>
    </div>

    <div class="operation-steps" aria-label="刷新审核时间执行步骤" aria-live="polite">
      <div v-for="(step, index) in refreshSteps" :key="step.label" class="operation-step" :class="`is-${step.status}`">
        <span class="step-index">{{ step.status === 'success' ? '✓' : step.status === 'failed' ? '!' : index + 1 }}</span>
        <div class="step-content">
          <strong>{{ step.label }}<span v-if="step.status !== 'pending'" class="step-status">{{ step.status === 'running' ? '执行中' : step.status === 'success' ? '已完成' : '失败' }}</span></strong>
          <small>{{ step.description }}</small>
        </div>
      </div>
    </div>

    <div class="manual-set">
      <label class="manual-label" for="review-time-input">手动指定时间</label>
      <el-date-picker
        id="review-time-input"
        v-model="setInput"
        class="manual-picker"
        type="datetime"
        placeholder="选择日期时间"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
      />
      <div class="manual-buttons">
        <el-button type="primary" plain :loading="saving" @click="onSaveManual">保存时间</el-button>
        <el-button @click="setInput = nowString()">设为当前</el-button>
      </div>
    </div>
    <p class="review-rule">仅控制“最新上线”列表：收费应用的上线时间须早于审核时间，免费应用不受限制。应用详情和下单不受影响。</p>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getReviewTime, setReviewTime, refreshReviewTime } from '@/api/config'
import type { GlobalConfig } from '@/types/ops'
import { formatDateTime } from '@/utils/date'
import { insertBundleProductRelations } from '@/api/ops-db'
import { rebuildAll } from '@/api/watchface-search'

// 默认用于预处理的 bundleId
const BUNDLE_ID = 107642

const emit = defineEmits<{ (e: 'updated', value: GlobalConfig | null): void }>()
const current = ref<GlobalConfig | null>(null)
const reviewTime = ref<string>('')
const loading = ref(false)
const saving = ref(false)
const refreshing = ref(false)
const setInput = ref<string>('')
type StepStatus = 'pending' | 'running' | 'success' | 'failed'
const refreshSteps = ref([
  { label: 'Bundle 关系预处理', description: `同步 Bundle #${BUNDLE_ID} 的产品关系`, status: 'pending' as StepStatus },
  { label: '更新审核时间', description: '将作品展示审核时间更新为当前时间', status: 'pending' as StepStatus },
  { label: '重建搜索索引', description: '提交后台重建任务，不等待重建完成', status: 'pending' as StepStatus },
])

const resetRefreshSteps = () => refreshSteps.value.forEach(step => { step.status = 'pending' })
const runRefreshStep = async (index: number, task: () => Promise<unknown>) => {
  refreshSteps.value[index].status = 'running'
  try {
    const result = await task()
    refreshSteps.value[index].status = 'success'
    return result
  } catch (error) {
    refreshSteps.value[index].status = 'failed'
    throw error
  }
}

const nowString = (): string => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${mi}:${s}`
}

const fetchCurrent = async () => {
  loading.value = true
  try {
    const res = await getReviewTime()
    current.value = res.data || null
    reviewTime.value = res.data?.configValue || ''
    if (!setInput.value && reviewTime.value) setInput.value = reviewTime.value
    emit('updated', current.value)
  } catch (e) {
    // ignore
  } finally {
    loading.value = false
  }
}

const onRefreshNow = async () => {
  try {
    await ElMessageBox.confirm(
      '该操作会依次同步 Bundle 产品关系、更新审核时间，并全量重建搜索索引。确认继续吗？',
      '确认刷新作品展示',
      { confirmButtonText: '执行三步刷新', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  refreshing.value = true
  resetRefreshSteps()
  try {
    await runRefreshStep(0, () => insertBundleProductRelations(BUNDLE_ID))
    const res = await runRefreshStep(1, refreshReviewTime) as Awaited<ReturnType<typeof refreshReviewTime>>
    if (res?.data?.configValue) {
      reviewTime.value = res.data.configValue
      setInput.value = reviewTime.value
      current.value = res.data
    } else {
      await fetchCurrent()
    }
    const rebuildRes = await runRefreshStep(2, () => rebuildAll(true)) as Awaited<ReturnType<typeof rebuildAll>>
    emit('updated', current.value)
    ElMessage.success(rebuildRes.data?.message || '索引重建已提交后台执行')
  } catch (e) {
    ElMessage.error('刷新未全部完成，请查看失败步骤后重试')
  } finally {
    refreshing.value = false
  }
}

const onSaveManual = async () => {
  if (!setInput.value) { ElMessage.warning('请先选择时间'); return }
  saving.value = true
  try {
    const res = await setReviewTime(setInput.value, '作品审核时间点')
    reviewTime.value = res.data?.configValue || setInput.value
    current.value = res.data || current.value
    emit('updated', current.value)
    ElMessage.success('已保存')
  } catch (e) {
    // 错误由拦截器提示
  } finally {
    saving.value = false
  }
}

onMounted(fetchCurrent)
</script>

<style scoped>
.review-card { margin-bottom: 20px; border: 1px solid var(--el-border-color-light); border-radius: 14px; }
.review-card :deep(.el-card__header) { padding: 18px 24px; border-bottom: 1px solid var(--el-border-color-lighter); }
.review-card :deep(.el-card__body) { padding: 24px; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.card-title { font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); }
.scope-tag { padding: 4px 10px; border-radius: 6px; background: var(--el-fill-color-light); color: var(--el-text-color-regular); font-size: 12px; white-space: nowrap; }
.review-body { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
.current-box { min-width: 0; }
.current-box .label { color: var(--el-text-color-regular); font-size: 13px; margin-bottom: 8px; }
.current-box .value { color: var(--el-text-color-primary); font-size: clamp(20px, 2.2vw, 28px); font-weight: 600; line-height: 1.4; letter-spacing: -.5px; overflow-wrap: anywhere; }
.current-box .value.is-empty { font-size: 18px; letter-spacing: 0; }
.meta { display: flex; flex-wrap: wrap; gap: 6px 20px; margin-top: 10px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }
.refresh { display: flex; flex: 0 0 auto; flex-direction: column; align-items: center; gap: 8px; }
.refresh-btn { height: 40px; padding: 0 22px; border-radius: 8px; font-weight: 600; }
.refresh-hint { color: var(--el-text-color-secondary); font-size: 12px; }
.operation-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
.operation-step { display: flex; gap: 12px; align-items: flex-start; padding: 16px; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; background: var(--el-fill-color-light); }
.step-index { display: grid; width: 26px; height: 26px; flex: 0 0 26px; place-items: center; border-radius: 8px; background: var(--el-bg-color); border: 1px solid var(--el-border-color-light); color: var(--el-text-color-regular); font-size: 12px; font-weight: 600; }
.step-content { min-width: 0; }
.operation-step strong { display: block; color: var(--el-text-color-primary); font-size: 13px; font-weight: 600; line-height: 26px; }
.operation-step small { display: block; margin-top: 3px; color: var(--el-text-color-regular); font-size: 12px; line-height: 1.6; }
.step-status { margin-left: 8px; font-size: 11px; font-weight: 400; }
.operation-step.is-running { border-color: var(--el-color-primary-light-5); background: var(--el-color-primary-light-9); }
.operation-step.is-running .step-index { background: var(--el-color-primary); border-color: var(--el-color-primary); color: white; }
.operation-step.is-success .step-index { background: var(--el-color-success); border-color: var(--el-color-success); color: white; }
.operation-step.is-failed { border-color: var(--el-color-danger-light-5); background: var(--el-color-danger-light-9); }
.operation-step.is-failed .step-index { background: var(--el-color-danger); border-color: var(--el-color-danger); color: white; }
.manual-set { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding-top: 20px; border-top: 1px solid var(--el-border-color-lighter); }
.manual-label { color: var(--el-text-color-regular); font-size: 13px; white-space: nowrap; margin-right: 4px; }
.manual-set :deep(.manual-picker) { width: 240px; flex: 0 1 240px; }
.manual-buttons { display: flex; gap: 8px; }
.manual-buttons .el-button + .el-button { margin-left: 0; }
.review-rule { margin: 16px 0 0; line-height: 1.7; color: var(--el-text-color-secondary); font-size: 12px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; font-variant-numeric: tabular-nums; }
@media (max-width: 960px) {
  .operation-steps { grid-template-columns: 1fr; gap: 8px; }
  .operation-step { padding: 12px 14px; }
}
@media (max-width: 600px) {
  .review-card :deep(.el-card__header), .review-card :deep(.el-card__body) { padding: 16px; }
  .card-header { flex-wrap: wrap; }
  .review-body { align-items: flex-start; flex-direction: column; gap: 16px; }
  .refresh { align-items: flex-start; }
  .manual-label { width: 100%; }
  .manual-set :deep(.manual-picker) { width: 100%; flex: 1 1 100%; }
}
</style>
