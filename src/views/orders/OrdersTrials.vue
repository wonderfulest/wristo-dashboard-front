<template>
  <div class="trials-page">
    <div class="page-header">
      <h2>试用记录管理</h2>
    </div>

    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
        </div>
      </template>

      <div class="search-form">
        <el-input
          v-model.number="searchForm.appId"
          placeholder="产品 ID"
          clearable
          style="width: 160px; margin-right: 12px;"
        />
        <el-input
          v-model.number="searchForm.bundleId"
          placeholder="套餐 ID"
          clearable
          style="width: 160px; margin-right: 12px;"
        />
        <el-input
          v-model="searchForm.email"
          placeholder="邮箱"
          clearable
          style="width: 220px; margin-right: 12px;"
        />
        <el-input
          v-model="searchForm.device"
          placeholder="设备"
          clearable
          style="width: 180px; margin-right: 12px;"
        />
        <el-select
          v-model="searchForm.status"
          placeholder="试用状态"
          clearable
          style="width: 200px; margin-right: 12px;"
        >
          <el-option :value="1" label="Start Trials" />
          <el-option :value="2" label="Code Displayed" />
          <el-option :value="3" label="Code Entered" />
          <el-option :value="10" label="Start Purchase" />
          <el-option :value="40" label="App Purchased" />
          <el-option :value="50" label="Bundle Purchased" />
          <el-option :value="60" label="Subscribed" />
          <el-option :value="-1" label="Refunded" />
        </el-select>
        <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card class="ops-card" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <span>数据维护</span>
        </div>
      </template>

      <div class="ops-form">
        <el-input
          v-model="backupMonth"
          placeholder="备份月份（yyyyMM，例如 202511）"
          clearable
          style="width: 260px; margin-right: 12px;"
        />
        <el-button type="primary" :loading="backupLoading" @click="handleBackupMonth">
          备份指定月份试用记录
        </el-button>
        <el-divider direction="vertical" />
        <el-input
          v-model="cleanupMonth"
          placeholder="清理月份（yyyyMM，例如 202511）"
          clearable
          style="width: 260px; margin-right: 12px;"
        />
        <el-button type="danger" :loading="cleanupLoading" @click="handleCleanupOld">
          清理历史试用记录
        </el-button>
      </div>
    </el-card>

    <el-card class="result-card" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <span>试用记录列表</span>
        </div>
      </template>

      <el-table :data="rows" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="appId" label="产品ID" width="120" />
        <el-table-column prop="bundleId" label="套餐ID" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="device" label="设备" width="160" />
        <el-table-column prop="platform" label="平台" width="120" />
        <el-table-column prop="isTest" label="测试" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.isTest ? 'warning' : 'info'">
              {{ row.isTest ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="skipTrial" label="跳过试用" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.skipTrial ? 'danger' : 'info'">
              {{ row.skipTrial ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="试用状态" width="140">
          <template #default="{ row }">
            {{ getStatusText(row.status) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :current-page="query.pageNum"
          :page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>

      <div v-if="!loading && rows.length === 0" class="empty">
        暂无试用记录
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTrialPage, backupTrialMonth, cleanupOldTrials, type TrialPageQueryDTO, type Trial } from '@/api/trial'

const loading = ref(false)
const total = ref(0)
const rows = ref<Trial[]>([])

const backupMonth = ref('')
const backupLoading = ref(false)
const cleanupLoading = ref(false)
const cleanupMonth = ref('')

const query = reactive<TrialPageQueryDTO>({
  pageNum: 1,
  pageSize: 20,
  orderBy: 'createdAt desc'
})

const searchForm = reactive({
  appId: undefined as number | undefined,
  bundleId: undefined as number | undefined,
  email: '',
  device: '',
  status: undefined as number | undefined
})

const fetchData = async () => {
  loading.value = true
  try {
    const dto: TrialPageQueryDTO = {
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      orderBy: query.orderBy,
      appId: searchForm.appId,
      bundleId: searchForm.bundleId,
      email: searchForm.email || undefined,
      device: searchForm.device || undefined,
      status: searchForm.status
    }
    const res = await getTrialPage(dto)
    if (res.data) {
      rows.value = res.data.list
      total.value = res.data.total
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '获取试用记录失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.pageNum = 1
  fetchData()
}

const handleReset = () => {
  searchForm.appId = undefined
  searchForm.bundleId = undefined
  searchForm.email = ''
  searchForm.device = ''
  searchForm.status = undefined
  query.pageNum = 1
  query.pageSize = 20
  query.orderBy = 'createdAt desc'
  fetchData()
}

const handlePageChange = (page: number) => {
  query.pageNum = page
  fetchData()
}

const handleSizeChange = (size: number) => {
  query.pageSize = size
  query.pageNum = 1
  fetchData()
}

const getStatusText = (status: number) => {
  switch (status) {
    case 1:
      return 'Start Trials (1)'
    case 2:
      return 'Code Displayed (2)'
    case 3:
      return 'Code Entered (3)'
    case 10:
      return 'Start Purchase (10)'
    case 40:
      return 'App Purchased (40)'
    case 50:
      return 'Bundle Purchased (50)'
    case 60:
      return 'Subscribed (60)'
    case -1:
      return 'Refunded (-1)'
    default:
      return String(status ?? '-')
  }
}

const formatDateTime = (value?: string | Date) => {
  if (!value) return '-'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleString('zh-CN')
}

const handleBackupMonth = async () => {
  if (!backupMonth.value) {
    ElMessage.warning('请输入备份月份（yyyyMM）')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认备份 ${backupMonth.value} 月的试用记录吗？`,
      '确认备份',
      { type: 'warning' }
    )
  } catch {
    return
  }

  backupLoading.value = true
  try {
    await backupTrialMonth(backupMonth.value)
    ElMessage.success('触发备份成功，请稍后在后端查看执行结果')
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '备份失败')
  } finally {
    backupLoading.value = false
  }
}

const handleCleanupOld = async () => {
  if (!cleanupMonth.value) {
    ElMessage.warning('请输入清理月份（yyyyMM）')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认清理 ${cleanupMonth.value} 以及更早月份的历史试用记录吗？该操作不可撤销，请谨慎操作。`,
      '确认清理',
      { type: 'warning' }
    )
  } catch {
    return
  }

  cleanupLoading.value = true
  try {
    const res = await cleanupOldTrials(cleanupMonth.value)
    const affected = res.data as unknown as number | undefined
    if (typeof affected === 'number') {
      ElMessage.success(`清理完成，共影响 ${affected} 条记录`)
    } else {
      ElMessage.success('清理任务已触发')
    }
    fetchData()
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '清理失败')
  } finally {
    cleanupLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.trials-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-card,
.result-card,
.ops-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.ops-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 32px 0;
}
</style>
