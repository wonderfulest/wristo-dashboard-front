<template>
  <div class="config-page">
    <div class="header">
      <h2>系统配置</h2>
      <div class="filters">
        <el-select v-model="query.category" placeholder="分类" clearable style="width: 180px" @change="fetchList">
          <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
        <el-input v-model="query.keyword" placeholder="按Key过滤 (本地)" clearable style="width: 220px" />
        <el-button type="primary" :loading="loading" @click="fetchList">刷新</el-button>
        <el-button @click="resetFilters">重置</el-button>
        <el-button type="success" @click="openCreate">新增配置</el-button>
      </div>
    </div>

    
    <el-table :data="filteredList" v-loading="loading" style="width:100%">
      <el-table-column prop="category" label="分类" width="120">
        <template #default="{ row }">
          <el-tag>{{ catLabel(row.category) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="configKey" label="Key" min-width="220" />
      <el-table-column label="Value" min-width="320">
        <template #default="{ row }">
          <div class="value-cell">
            <el-tooltip placement="top" :content="row.configValue">
              <span class="mono">{{ truncate(row.configValue, 80) }}</span>
            </el-tooltip>
            <el-button type="primary" link @click="copy(row.configValue)">复制</el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="220" />
      <el-table-column prop="updatedBy" label="更新人" width="120" />
      <el-table-column prop="updatedAt" label="更新时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button size="small" link @click="openHistory(row)">历史</el-button>
          <el-button
            size="small"
            :type="row.isActive ? 'success' : 'danger'"
            link
            :loading="activatingKey === row.configKey"
            @click="toggleActive(row)"
          >
            {{ row.isActive ? '禁用' : '激活' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>


    <!-- 审核时间快捷区域 -->
    <el-card class="quick-review" shadow="never">
      <template #header>
        <div class="card-header">
          <span>审核时间（audit.review_time）快捷设置</span>
        </div>
      </template>
      <div class="quick-body">
        <div class="current">
          <div class="label">当前审核时间：</div>
          <div class="value mono">{{ reviewTime || '-' }}</div>
        </div>
        <div class="ops">
          <el-button type="primary" :loading="reviewRefreshing" @click="refreshReview">刷新为当前时间</el-button>
          <el-date-picker v-model="reviewInput" type="datetime" placeholder="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" style="width: 240px" />
          <el-button type="success" :loading="reviewSaving" @click="saveReviewManual">保存</el-button>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="editVisible" :title="isCreate ? '新增配置' : '编辑配置'" width="640px">
      <el-form :model="editForm" label-width="110px">
        <el-form-item label="分类">
          <el-select v-model="editForm.category" style="width: 240px">
            <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Key">
          <el-input v-model="editForm.configKey" :disabled="!isCreate" />
        </el-form-item>
        <el-form-item label="Value">
          <el-input v-model="editForm.config_value" type="textarea" :rows="8" placeholder="文本或JSON字符串" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="historyVisible" title="修改历史" size="50%">
      <el-table :data="histories" v-loading="historyLoading">
        <el-table-column prop="version" label="版本" width="90" />
        <el-table-column prop="updatedBy" label="操作人" width="140" />
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="改动" min-width="360">
          <template #default="{ row }">
            <div class="diff">
              <div class="diff-item"><span class="k">旧值</span><pre class="mono">{{ row.oldValue }}</pre></div>
              <div class="diff-item"><span class="k">新值</span><pre class="mono">{{ row.newValue }}</pre></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="220" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listConfigs, upsertConfig, getConfigHistory, getReviewTime, setReviewTime, refreshReviewTime, activateConfig } from '@/api/config'
import type { GlobalConfig, GlobalConfigHistory, GlobalConfigCategoryCode } from '@/types/ops'
import { formatDateTime } from '@/utils/date'

const categoryOptions = [
  { label: '审计', value: 'audit' },
  { label: '前端', value: 'frontend' },
  { label: '业务', value: 'business' },
  { label: '系统', value: 'system' },
  { label: '第三方', value: 'thirdparty' },
] as { label: string; value: GlobalConfigCategoryCode }[]

const catLabel = (c?: string) => categoryOptions.find(i => i.value === c)?.label || c || '-'

const query = ref<{ category?: GlobalConfigCategoryCode | ''; keyword: string }>({ category: '', keyword: '' })
const loading = ref(false)
const list = ref<GlobalConfig[]>([])

const activatingKey = ref<string | null>(null)

const filteredList = computed(() => {
  const kw = query.value.keyword?.trim().toLowerCase()
  return list.value.filter(it => !kw || it.configKey.toLowerCase().includes(kw))
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await listConfigs(query.value.category || undefined)
    list.value = res.data || []
  } catch (e) {
    ElMessage.error('获取配置失败')
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  query.value = { category: '', keyword: '' }
  fetchList()
}

const toggleActive = async (row: GlobalConfig) => {
  if (!row?.configKey) return
  const target = !row.isActive
  activatingKey.value = row.configKey
  try {
    await activateConfig(row.configKey, target)
    row.isActive = target
    ElMessage.success(target ? '已激活' : '已禁用')
  } catch (e) {
    // 错误提示由拦截器统一处理
  } finally {
    activatingKey.value = null
  }
}

// edit
const editVisible = ref(false)
const saving = ref(false)
const isCreate = ref(false)
const editForm = ref<{ category?: GlobalConfigCategoryCode; configKey: string; config_value: string; description: string | null }>({
  category: undefined,
  configKey: '',
  config_value: '',
  description: null,
})

const openCreate = () => {
  isCreate.value = true
  editForm.value = { category: query.value.category || undefined, configKey: '', config_value: '', description: null }
  editVisible.value = true
}

const openEdit = (row: GlobalConfig) => {
  isCreate.value = false
  editForm.value = {
    category: row.category,
    configKey: row.configKey,
    config_value: row.configValue,
    description: row.description ?? null,
  }
  editVisible.value = true
}

const submitEdit = async () => {
  if (!editForm.value.configKey) { ElMessage.warning('请填写 Key'); return }
  if (!editForm.value.category) { ElMessage.warning('请选择分类'); return }
  // 针对审核时间项进行格式校验
  if ((editForm.value.category === 'audit' && editForm.value.configKey === 'review_time') && !isValidDateTime(editForm.value.config_value)) {
    ElMessage.warning('时间格式无效，请使用 YYYY-MM-DD HH:mm:ss');
    return
  }
  saving.value = true
  try {
    const res = await upsertConfig(editForm.value.configKey, {
      category: editForm.value.category,
      config_value: editForm.value.config_value,
      description: editForm.value.description,
    })
    ElMessage.success('保存成功')
    editVisible.value = false
    // 更新列表中的项
    const idx = list.value.findIndex(i => i.configKey === res.data?.configKey && i.category === res.data?.category)
    if (idx >= 0 && res.data) list.value[idx] = res.data
    else if (res.data) list.value.unshift(res.data)
    // 如果是新增并且当前筛选了分类，且新增的分类与筛选不同，则可选：刷新列表
    // 这里简单处理：若当前有筛选，与新增分类不一致，不自动刷新
  } catch (e) {
    // 拦截器已提示
  } finally {
    saving.value = false
  }
}

// history
const historyVisible = ref(false)
const historyLoading = ref(false)
const histories = ref<GlobalConfigHistory[]>([])

const openHistory = async (row: GlobalConfig) => {
  historyVisible.value = true
  historyLoading.value = true
  try {
    const res = await getConfigHistory(row.configKey, row.category)
    histories.value = res.data || []
  } catch (e) {
    histories.value = []
  } finally {
    historyLoading.value = false
  }
}

const truncate = (s: string, n = 120) => (s?.length > n ? s.slice(0, n) + '…' : s)
const copy = async (s: string) => {
  try { await navigator.clipboard.writeText(s); ElMessage.success('已复制') } catch { ElMessage.error('复制失败') }
}

// ------------- 审核时间快捷逻辑 -------------
const reviewTime = ref<string>('')
const reviewInput = ref<string>('')
const reviewSaving = ref(false)
const reviewRefreshing = ref(false)

const isValidDateTime = (s: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return false
  const d = new Date(s.replace(' ', 'T'))
  if (isNaN(d.getTime())) return false
  // 再格式化回去比较，避免 2025-13-40 这类
  const pad = (n: number) => String(n).padStart(2, '0')
  const back = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  return back === s
}

const fetchReview = async () => {
  try {
    const res = await getReviewTime()
    reviewTime.value = res.data?.configValue || ''
    if (!reviewInput.value && reviewTime.value) reviewInput.value = reviewTime.value
  } catch {}
}

const refreshReview = async () => {
  reviewRefreshing.value = true
  try {
    const res = await refreshReviewTime()
    if (res?.data?.configValue) {
      reviewTime.value = res.data.configValue
      reviewInput.value = reviewTime.value
    } else {
      await fetchReview()
    }
    ElMessage.success('已刷新为当前时间')
  } finally { reviewRefreshing.value = false }
}

const saveReviewManual = async () => {
  if (!reviewInput.value) { ElMessage.warning('请先选择时间'); return }
  if (!isValidDateTime(reviewInput.value)) { ElMessage.warning('时间格式无效，请使用 YYYY-MM-DD HH:mm:ss'); return }
  reviewSaving.value = true
  try {
    const res = await setReviewTime(reviewInput.value, '作品审核时间点')
    reviewTime.value = res.data?.configValue || reviewInput.value
    ElMessage.success('已保存')
  } finally { reviewSaving.value = false }
}

onMounted(async () => {
  await Promise.all([fetchList(), fetchReview()])
})
</script>

<style scoped>
.config-page { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { display: flex; gap: 12px; align-items: center; }
.quick-review { margin-top: 96px; margin-bottom: 16px; }
.quick-body { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.current { display: flex; align-items: center; gap: 8px; }
.value-cell { display: flex; gap: 8px; align-items: center; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; white-space: nowrap; }
.diff { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.diff-item { border: 1px solid var(--el-border-color); border-radius: 6px; padding: 8px; }
.diff-item .k { font-weight: 600; color: var(--el-color-primary); margin-right: 8px; }
</style>
