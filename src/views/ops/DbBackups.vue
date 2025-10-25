<template>
  <div class="db-backups-container">
    <div class="header">
      <h2>数据库备份</h2>
      <div style="display:flex; gap:12px; align-items:center;">
        <el-input-number v-model="limit" :min="1" :max="200" :step="5" :controls="false" style="width: 120px" />
        <el-button @click="fetchRecent" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="openStartDialog">手动开启备份</el-button>
      </div>
    </div>

    <el-table :data="jobs" v-loading="loading" style="width:100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="类型" width="140">
        <template #default="{ row }">
          <div class="cell-two-lines">
            <span>DB: {{ row.dbType }}</span>
            <span>备份: {{ row.backupType }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="文件" min-width="260">
        <template #default="{ row }">
          <div class="file-box">
            <div class="file-name">{{ row.fileName }}</div>
            <el-link v-if="row.storagePath" :href="row.storagePath" target="_blank" type="primary" :underline="false">{{ row.storagePath }}</el-link>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="140">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="operator" label="操作人" width="120" />
      <el-table-column label="时间" min-width="260">
        <template #default="{ row }">
          <div class="cell-two-lines">
            <span>开始: {{ formatDateTime(row.startedAt) || '-' }}</span>
            <span>结束: {{ formatDateTime(row.finishedAt) || '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="创建/更新" min-width="260">
        <template #default="{ row }">
          <div class="cell-two-lines">
            <span>创建: {{ formatDateTime(row.createdAt) }}</span>
            <span>更新: {{ formatDateTime(row.updatedAt) || '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="viewDetails(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="detailVisible" title="备份详情" size="50%">
      <div v-if="current" class="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">{{ current.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(current.status)">{{ statusText(current.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="DB 类型">{{ current.dbType }}</el-descriptions-item>
          <el-descriptions-item label="备份类型">{{ current.backupType }}</el-descriptions-item>
          <el-descriptions-item label="文件名" :span="2">{{ current.fileName }}</el-descriptions-item>
          <el-descriptions-item label="存储路径" :span="2">
            <el-link v-if="current.storagePath" :href="current.storagePath" target="_blank" type="primary" :underline="false">
              {{ current.storagePath }}
            </el-link>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">{{ current.operator }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(current.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatDateTime(current.startedAt) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ formatDateTime(current.finishedAt) || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="msg">
          <div class="msg-title">消息/输出</div>
          <el-input type="textarea" :rows="12" :model-value="current.message || ''" readonly />
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="startVisible" title="手动开启备份" width="520px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="数据库类型">
          <el-select v-model="form.dbType" style="width: 240px">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgres" />
          </el-select>
        </el-form-item>
        <el-form-item label="备份类型">
          <el-select v-model="form.backupType" style="width: 240px">
            <el-option label="完全备份" value="FULL" />
            <el-option label="增量备份" value="INCREMENTAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="存储路径">
          <el-input v-model="form.storagePath" placeholder="目录或URL，例如: https://cdn... 或 /data/backup" />
        </el-form-item>
        <el-form-item label="文件名">
          <el-input v-model="form.fileName" placeholder="留空自动生成 (可选)" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="form.operator" placeholder="操作者标识" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="startVisible = false">取消</el-button>
        <el-button type="primary" :loading="starting" @click="submitStart">开始</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getRecentDbBackups, startDbBackup, getDbBackup } from '@/api/ops-db'
import type { DbBackupJob, DbBackupStartDTO } from '@/types/ops'
import { formatDateTime } from '@/utils/date'
import { useUserStore } from '@/store/user'

const loading = ref(false)
const jobs = ref<DbBackupJob[]>([])
const limit = ref(7)

const detailVisible = ref(false)
const current = ref<DbBackupJob | null>(null)

const startVisible = ref(false)
const starting = ref(false)
const form = ref<DbBackupStartDTO>({
  dbType: 'mysql',
  backupType: 'FULL',
  storagePath: '/data/backup',
  fileName: '',
  operator: ''
})

const userStore = useUserStore()
if (userStore?.userInfo?.username) {
  form.value.operator = userStore.userInfo.username
}

const statusType = (status: string): 'info' | 'warning' | 'success' | 'danger' => {
  switch (status) {
    case 'PENDING': return 'info'
    case 'RUNNING': return 'warning'
    case 'SUCCESS': return 'success'
    case 'FAILED': return 'danger'
    default: return 'info'
  }
}
const statusText = (status: string): string => {
  switch (status) {
    case 'PENDING': return '排队中'
    case 'RUNNING': return '进行中'
    case 'SUCCESS': return '成功'
    case 'FAILED': return '失败'
    default: return status
  }
}

const fetchRecent = async () => {
  loading.value = true
  try {
    const res = await getRecentDbBackups(limit.value)
    jobs.value = res.data || []
  } catch (e) {
    ElMessage.error('获取备份记录失败')
  } finally {
    loading.value = false
  }
}

const viewDetails = async (row: DbBackupJob) => {
  try {
    const res = await getDbBackup(row.id)
    current.value = res.data || row
    detailVisible.value = true
  } catch (e) {
    current.value = row
    detailVisible.value = true
  }
}

const openStartDialog = () => {
  startVisible.value = true
}

const submitStart = async () => {
  if (!form.value.storagePath) {
    ElMessage.warning('请填写存储路径')
    return
  }
  starting.value = true
  try {
    const res = await startDbBackup(form.value)
    ElMessage.success('备份任务已创建')
    startVisible.value = false
    // 立即刷新，并将返回的任务放到最前面
    await fetchRecent()
    if (res.data) {
      jobs.value = [res.data, ...jobs.value.filter(j => j.id !== res.data!.id)]
    }
  } catch (e) {
    // 错误已在拦截器提示
  } finally {
    starting.value = false
  }
}

onMounted(fetchRecent)
</script>

<style scoped>
.db-backups-container { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.cell-two-lines { display: flex; flex-direction: column; line-height: 1.4; }
.file-box { display: flex; flex-direction: column; gap: 4px; }
.file-name { font-weight: 600; }
.msg { margin-top: 16px; }
.msg-title { font-weight: 600; margin-bottom: 8px; }
</style>
