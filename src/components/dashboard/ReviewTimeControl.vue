<template>
  <el-card class="review-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span>作品展示审核时间点</span>
      </div>
    </template>

    <div class="review-body">
      <div class="current-box">
        <div class="label">当前审核时间：</div>
        <div class="value mono">{{ reviewTime || '-' }}</div>
        <div class="meta">
          <span>最近修改人：{{ current?.updatedBy || '-' }}</span>
          <span>最近修改时间：{{ current?.updatedAt ? formatDateTime(current!.updatedAt) : '-' }}</span>
        </div>
      </div>

      <div class="actions">
        <div class="operation-steps" aria-label="刷新审核时间执行步骤">
          <div v-for="(step, index) in refreshSteps" :key="step.label" class="operation-step" :class="`is-${step.status}`">
            <span class="step-index">{{ step.status === 'success' ? '✓' : step.status === 'failed' ? '!' : index + 1 }}</span>
            <div><strong>{{ step.label }}</strong><small>{{ step.description }}</small></div>
          </div>
        </div>
        <div class="refresh">
          <el-button class="circle-btn" type="primary" :loading="refreshing" @click="onRefreshNow">
            刷新为当前时间
          </el-button>
        
        </div>

        <div class="manual-set">
          <div class="label">手动指定时间</div>
          <el-date-picker
            v-model="setInput"
            type="datetime"
            placeholder="选择日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 260px"
          />
          <el-button type="primary" :loading="saving" @click="onSaveManual">保存</el-button>
          <el-button @click="setInput = nowString()">设为当前</el-button>
        </div>
      </div>
    </div>
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
  { label: '重建搜索索引', description: '清理并全量重建应用搜索索引', status: 'pending' as StepStatus },
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
    await runRefreshStep(2, () => rebuildAll(true))
    emit('updated', current.value)
    ElMessage.success('三步刷新已全部完成')
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
.review-card { margin-top: 12px; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.review-body { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: center; }
.current-box { display: flex; flex-direction: column; gap: 6px; }
.current-box .label { color: var(--el-text-color-secondary); }
.current-box .value { font-size: 20px; font-weight: 600; }
.current-box .meta { display: flex; gap: 16px; color: var(--el-text-color-secondary); font-size: 12px; }
.actions { display: flex; flex-direction: column; gap: 16px; align-items: stretch; }
.operation-steps { display: grid; gap: 8px; }
.operation-step { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border: 1px solid #e5ebe8; border-radius: 10px; background: #fafcfb; }
.operation-step .step-index { display: grid; width: 25px; height: 25px; flex: 0 0 25px; place-items: center; border-radius: 50%; background: #e7eeea; color: #607069; font-size: 12px; font-weight: 800; }
.operation-step div { display: flex; min-width: 0; flex-direction: column; }.operation-step strong { color: #34473e; font-size: 13px; }.operation-step small { color: #8a9790; font-size: 11px; }
.operation-step.is-running { border-color: #8fcdb0; background: #f1faf5; }.operation-step.is-running .step-index { background: #15915f; color: #fff; }
.operation-step.is-success .step-index { background: #15915f; color: #fff; }.operation-step.is-failed { border-color: #e8a8a1; background: #fff7f6; }.operation-step.is-failed .step-index { background: #c94f43; color: #fff; }
.refresh { display: flex; justify-content: center; }
.circle-btn { width: 160px; height: 160px; border-radius: 50%; font-size: 16px; font-weight: 600; }
.manual-set { display: flex; align-items: center; gap: 12px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
@media (max-width: 960px) {
  .review-body { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .card-header { align-items: flex-start; flex-direction: column; gap: 8px; }
  .current-box .meta { flex-wrap: wrap; gap: 6px 12px; }
  .manual-set { width: 100%; align-items: stretch; flex-direction: column; }
  .circle-btn { width: 132px; height: 132px; }
}
</style>
