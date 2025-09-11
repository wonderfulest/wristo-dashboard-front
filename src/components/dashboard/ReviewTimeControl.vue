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
import { ElMessage } from 'element-plus'
import { getReviewTime, setReviewTime, refreshReviewTime } from '@/api/config'
import type { GlobalConfig } from '@/types/ops'
import { formatDateTime } from '@/utils/date'
import { insertBundleProductRelations } from '@/api/ops-db'

// 默认用于预处理的 bundleId
const BUNDLE_ID = 107642

const emit = defineEmits<{ (e: 'updated', value: GlobalConfig | null): void }>()
const current = ref<GlobalConfig | null>(null)
const reviewTime = ref<string>('')
const loading = ref(false)
const saving = ref(false)
const refreshing = ref(false)
const setInput = ref<string>('')

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
  refreshing.value = true
  try {
    await insertBundleProductRelations(BUNDLE_ID)
    const res = await refreshReviewTime()
    if (res?.data?.configValue) {
      reviewTime.value = res.data.configValue
      setInput.value = reviewTime.value
      current.value = res.data
    } else {
      await fetchCurrent()
    }
    emit('updated', current.value)
    ElMessage.success('已刷新为当前时间')
  } catch (e) {
    // 错误由拦截器提示
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
.actions { display: flex; flex-direction: column; gap: 16px; align-items: center; }
.refresh { display: flex; justify-content: center; }
.circle-btn { width: 160px; height: 160px; border-radius: 50%; font-size: 16px; font-weight: 600; }
.manual-set { display: flex; align-items: center; gap: 12px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
@media (max-width: 960px) {
  .review-body { grid-template-columns: 1fr; }
}
</style>
