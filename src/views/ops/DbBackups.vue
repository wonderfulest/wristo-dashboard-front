<template>
  <div class="db-backups-container">
    <div class="header">
      <div style="display:flex; gap:12px; align-items:center;">
        <el-input-number v-model="limit" :min="1" :max="200" :step="5" :controls="false" style="width: 120px" />
        <el-button @click="refreshCurrent" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="openStartDialog">手动开启备份</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="可用备份" name="available">
        <el-alert
          title="此列表直接读取 S3，仅展示当前实际可用于恢复的备份文件。"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 12px"
        />
        <el-table :data="files" v-loading="loading" style="width:100%">
          <el-table-column prop="fileName" label="文件名" min-width="320" />
          <el-table-column label="大小" width="140">
            <template #default="{ row }">{{ formatFileSize(row.size) }}</template>
          </el-table-column>
          <el-table-column label="S3 更新时间" min-width="220">
            <template #default="{ row }">{{ formatDateTime(row.lastModified) }}</template>
          </el-table-column>
          <el-table-column prop="key" label="S3 Key" min-width="320" show-overflow-tooltip />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link :loading="downloadingKey === row.key" @click="downloadBackup(row)">下载</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="执行记录" name="history">
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
      <el-table-column prop="nodeIp" label="执行节点" width="150" show-overflow-tooltip />
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
      </el-tab-pane>
    </el-tabs>

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
          <el-descriptions-item label="执行节点 IP">{{ current.nodeIp || '-' }}</el-descriptions-item>
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

    <el-dialog v-model="startVisible" title="手动开启备份" width="min(800px, 92vw)">
      <el-alert
        title="请登录 US1 数据库服务器（SSH 别名 wristo-api-us1），在宿主机终端使用 root 或具有 sudo 权限的账号执行以下命令。"
        type="info"
        :closable="false"
        show-icon
      />
      <pre class="backup-command"><code>{{ manualBackupCommand }}</code></pre>
      <p>命令调用已安装的备份服务，仅备份 wristo 数据库。服务使用 /opt/wristo/wristo-tools/deploy/us1/maintenance.py，无需切换目录或手动加载环境变量。</p>
      <p>systemctl start 会等待任务结束；已有备份正在运行时会等待该任务。请勿重复执行，也不要添加 --no-block。</p>
      <p>确认命令显示“备份任务成功结束”，且 Result=success、ExecMainStatus=0；核对 backup-success.json 中的 finished_at（UTC）和 key，再返回此页面刷新“可用备份”和“执行记录”。云端备份位于 mysql/backups/us1/。</p>
      <p>若执行失败，请查看命令末尾输出的日志。backup-success.json 可能保留上次成功上传的信息，不能单凭该文件判断本次任务成功。</p>
      <template #footer>
        <el-button @click="startVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyBackupCommand">复制命令</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAvailableDbBackups, getDbBackupDownloadUrl, getRecentDbBackups, getDbBackup } from '@/api/ops-db'
import type { DbBackupFile, DbBackupJob } from '@/types/ops'
import { formatDateTime } from '@/utils/date'

const loading = ref(false)
const activeTab = ref<'available' | 'history'>('available')
const files = ref<DbBackupFile[]>([])
const jobs = ref<DbBackupJob[]>([])
const limit = ref(7)
const downloadingKey = ref('')

const detailVisible = ref(false)
const current = ref<DbBackupJob | null>(null)

const startVisible = ref(false)
const manualBackupCommand = `if sudo systemctl start wristo-us1-backup.service; then
  echo "备份任务成功结束"
  sudo cat /var/lib/wristo-us1-maintenance/backup-success.json
else
  echo "备份任务失败，请检查下方服务状态和日志"
fi
sudo systemctl show wristo-us1-backup.service -p Result -p ExecMainStatus
sudo tail -n 80 /var/log/wristo-us1/backup.log`

const copyBackupCommand = async () => {
  try {
    await navigator.clipboard.writeText(manualBackupCommand)
    ElMessage.success('命令已复制，请登录服务器执行')
  } catch {
    ElMessage.warning('复制失败，请手动选中并复制上方命令')
  }
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

const fetchAvailable = async () => {
  loading.value = true
  try {
    const res = await getAvailableDbBackups(limit.value)
    files.value = res.data || []
  } catch (e) {
    ElMessage.error('获取 S3 可用备份失败')
  } finally {
    loading.value = false
  }
}

const refreshCurrent = () => activeTab.value === 'available' ? fetchAvailable() : fetchRecent()

const handleTabChange = () => refreshCurrent()

const formatFileSize = (size: number): string => {
  if (!Number.isFinite(size) || size < 0) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`
}

const downloadBackup = async (file: DbBackupFile) => {
  downloadingKey.value = file.key
  try {
    const res = await getDbBackupDownloadUrl(file.key)
    if (!res.data?.url) {
      ElMessage.error('未获取到下载地址')
      return
    }
    window.location.assign(res.data.url)
  } catch (e) {
    ElMessage.error('获取备份下载地址失败')
  } finally {
    downloadingKey.value = ''
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

onMounted(fetchAvailable)
</script>

<style scoped>
.db-backups-container { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.cell-two-lines { display: flex; flex-direction: column; line-height: 1.4; }
.file-box { display: flex; flex-direction: column; gap: 4px; }
.file-name { font-weight: 600; }
.backup-command { margin: 16px 0; padding: 16px; overflow-x: auto; background: var(--el-fill-color-light); border-radius: 4px; font-size: 13px; line-height: 1.6; user-select: text; }
.msg { margin-top: 16px; }
.msg-title { font-weight: 600; margin-bottom: 8px; }
</style>
