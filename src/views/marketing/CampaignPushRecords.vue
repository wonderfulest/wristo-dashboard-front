<template>
  <div class="campaign-push-records-page">
    <div class="page-header">
      <h2>营销推送记录</h2>
      <div>
        <el-button type="primary" @click="openCreate">新建推送记录</el-button>
        <el-button type="success" :disabled="selectedRows.length === 0 || sending" :loading="sending" @click="handleBatchTrigger">发送推送</el-button>
        <el-button @click="fetchPage">刷新</el-button>
      </div>
    </div>

    <div class="search-filters">
      <el-input-number v-model="filters.campaignId" placeholder="活动ID" clearable style="width: 160px; margin-right: 12px;" :controls="false" />
      <UserSelect
        v-model="searchUserId"
        :role-authorities="['ROLE_USER']"
        placeholder="按用户搜索"
        @change="handleUserChange"
      />
      <el-select v-model="filters.channel" clearable placeholder="推送渠道" style="width: 160px; margin-right: 12px;">
        <el-option label="SES" value="SES" />
        <el-option label="ZOHO" value="ZOHO" />
      </el-select>
      <el-select v-model="filters.status" clearable placeholder="状态" style="width: 160px; margin-right: 12px;">
        <el-option label="草稿" value="DRAFT" />
        <el-option label="发送中" value="SENDING" />
        <el-option label="成功" value="SUCCESS" />
        <el-option label="失败" value="FAILED" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-table :data="list" v-loading="loading" style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="48" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="campaignId" label="活动ID" width="100" />
      <el-table-column prop="userId" label="用户ID" width="100" />
      <el-table-column prop="channel" label="推送渠道" width="120">
        <template #default="{ row }">
          {{ row.channel || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="templateId" label="模板ID" width="100">
        <template #default="{ row }">
          {{ row.templateId || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="180">
        <template #default="{ row }">
          {{ row.email || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ row.status || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.startedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="完成时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.finishedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="info" link @click="viewDetail(row)">详情</el-button>
          <el-button type="success" link :disabled="sending" @click="handleTriggerOne(row)">发送</el-button>
          <el-button type="danger" link @click="confirmDelete(row)">删除</el-button>
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

    <el-dialog v-model="createVisible" title="新建推送记录" width="600px">
      <el-form :model="createForm" label-width="120px">
        <el-form-item label="活动ID" required>
          <el-input-number v-model="createForm.campaignId" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="用户ID" required>
          <el-input-number v-model="createForm.userId" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="推送渠道">
          <el-select v-model="createForm.channel" clearable placeholder="选择渠道" style="width: 100%">
            <el-option label="SES" value="SES" />
            <el-option label="ZOHO" value="ZOHO" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板ID">
          <el-input-number v-model="createForm.templateId" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="createForm.email" placeholder="接收邮箱地址" />
        </el-form-item>
        <el-form-item label="变量">
          <el-input v-model="createForm.variables" type="textarea" :rows="3" placeholder="JSON格式变量" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="createForm.status" placeholder="选择状态" style="width: 100%">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="发送中" value="SENDING" />
            <el-option label="成功" value="SUCCESS" />
            <el-option label="失败" value="FAILED" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleCreate">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="编辑推送记录" width="960px">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="活动ID">
          <el-input-number v-model="editForm.campaignId" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input-number v-model="editForm.userId" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="推送渠道">
          <el-select v-model="editForm.channel" clearable placeholder="选择渠道" style="width: 100%">
            <el-option label="SES" value="SES" />
            <el-option label="ZOHO" value="ZOHO" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板ID">
          <el-input-number v-model="editForm.templateId" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="变量">
          <el-input v-model="editForm.variables" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" clearable placeholder="选择状态" style="width: 100%">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="发送中" value="SENDING" />
            <el-option label="成功" value="SUCCESS" />
            <el-option label="失败" value="FAILED" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleUpdate">更新</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="推送记录详情" width="700px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="ID">{{ currentRecord.id }}</el-descriptions-item>
        <el-descriptions-item label="活动ID">{{ currentRecord.campaignId }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ currentRecord.userId }}</el-descriptions-item>
        <el-descriptions-item label="推送渠道">{{ currentRecord.channel || '-' }}</el-descriptions-item>
        <el-descriptions-item label="模板ID">{{ currentRecord.templateId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentRecord.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(currentRecord.status)">{{ currentRecord.status || '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建者ID">{{ currentRecord.createdBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开始时间" :span="2">{{ formatDateTime(currentRecord.startedAt) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间" :span="2">{{ formatDateTime(currentRecord.finishedAt) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(currentRecord.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间" :span="2">{{ formatDateTime(currentRecord.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item label="变量" :span="2">
          <pre style="margin: 0; white-space: pre-wrap; word-break: break-all;">{{ currentRecord.variables || '-' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="sendProgress.visible" title="发送进度" width="760px" :close-on-click-modal="false" :close-on-press-escape="false">
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div>进度：{{ sendProgress.done }}/{{ sendProgress.total }}</div>
          <div v-if="sendProgress.currentId">当前：#{{ sendProgress.currentId }}</div>
        </div>
        <el-progress :percentage="sendProgress.total ? Math.round((sendProgress.done / sendProgress.total) * 100) : 0" />
      </div>
      <el-table :data="sendProgress.results" size="small" style="width: 100%" max-height="360">
        <el-table-column prop="id" label="推送ID" width="100" />
        <el-table-column prop="status" label="结果" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'">{{ row.status === 'success' ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="信息" min-width="200" />
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button :disabled="sending" @click="sendProgress.visible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCampaignPushPage, createCampaignPush, updateCampaignPush, deleteCampaignPush, triggerCampaignPushOne } from '@/api/campaign-push'
import type {
  CampaignPushVO,
  CampaignPushCreateDTO,
  CampaignPushUpdateDTO,
  CampaignPushPageQuery,
  CampaignPushChannel,
  CampaignPushStatus
} from '@/types/promotion'
import UserSelect from '@/components/users/UserSelect.vue'

const loading = ref(false)
const total = ref(0)
const list = ref<CampaignPushVO[]>([])

const selectedRows = ref<CampaignPushVO[]>([])
const sending = ref(false)

const sendProgress = reactive<{
  visible: boolean
  total: number
  done: number
  currentId?: number
  results: Array<{ id: number; status: 'success' | 'fail'; message?: string }>
}>({
  visible: false,
  total: 0,
  done: 0,
  currentId: undefined,
  results: []
})

const query = reactive<CampaignPushPageQuery>({
  pageNum: 1,
  pageSize: 10,
  orderBy: 'createdAt desc'
})

const filters = reactive<{ campaignId?: number; userId?: number; channel?: CampaignPushChannel; status?: CampaignPushStatus }>({})

const searchUserId = ref<number | undefined>(undefined)

const handleUserChange = (val?: number) => {
  filters.userId = val
  handleSearch()
}

const handleSelectionChange = (rows: CampaignPushVO[]) => {
  selectedRows.value = rows || []
}

const createVisible = ref(false)
const editVisible = ref(false)
const detailVisible = ref(false)
const saving = ref(false)
const currentRecord = ref<CampaignPushVO | null>(null)

const createForm = reactive<CampaignPushCreateDTO>({
  campaignId: 0,
  userId: 0,
  channel: undefined,
  templateId: undefined,
  email: '',
  variables: '',
  status: 'DRAFT'
})

const editForm = reactive<CampaignPushUpdateDTO>({
  campaignId: undefined,
  userId: undefined,
  channel: undefined,
  templateId: undefined,
  email: '',
  variables: '',
  status: undefined
})

const statusType = (status?: string) => {
  if (!status) return 'info'
  const s = status.toLowerCase()
  if (s === 'success') return 'success'
  if (s === 'failed') return 'danger'
  if (s === 'sending') return 'warning'
  if (s === 'draft') return 'info'
  return 'info'
}

const doTriggerList = async (rows: CampaignPushVO[]) => {
  if (!rows || rows.length === 0) return

  sending.value = true
  sendProgress.visible = true
  sendProgress.total = rows.length
  sendProgress.done = 0
  sendProgress.currentId = undefined
  sendProgress.results = []

  for (const r of rows) {
    const id = Number((r as any)?.id)
    if (!id) continue
    sendProgress.currentId = id
    try {
      await triggerCampaignPushOne(id)
      sendProgress.results.push({ id, status: 'success', message: '' })
    } catch (e: any) {
      sendProgress.results.push({ id, status: 'fail', message: e?.msg || e?.message || '发送失败' })
    } finally {
      sendProgress.done += 1
    }
  }

  sendProgress.currentId = undefined
  sending.value = false
}

const handleTriggerOne = async (row: CampaignPushVO) => {
  try {
    await ElMessageBox.confirm(`确认发送推送记录 #${row.id} 吗？`, '发送确认', { type: 'warning' })
  } catch {
    return
  }
  await doTriggerList([row])
}

const handleBatchTrigger = async () => {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请先勾选要发送的推送记录')
    return
  }
  try {
    await ElMessageBox.confirm(`确认发送选中的 ${selectedRows.value.length} 条推送记录吗？将按顺序逐条发送。`, '批量发送确认', { type: 'warning' })
  } catch {
    return
  }
  await doTriggerList([...selectedRows.value])
}

const formatDateTime = (v?: string) => (v ? new Date(v).toLocaleString('zh-CN') : '-')

const fetchPage = async () => {
  loading.value = true
  try {
    const params: CampaignPushPageQuery = {
      ...query,
      campaignId: filters.campaignId,
      userId: filters.userId,
      channel: filters.channel,
      status: filters.status
    }
    const res = await getCampaignPushPage(params)
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e) {
    ElMessage.error('获取推送记录列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  query.pageNum = page
  fetchPage()
}

const handleSizeChange = (size: number) => {
  query.pageSize = size
  query.pageNum = 1
  fetchPage()
}

const handleSearch = () => {
  query.pageNum = 1
  fetchPage()
}

const resetSearch = () => {
  filters.campaignId = undefined
  filters.userId = undefined
  searchUserId.value = undefined
  filters.channel = undefined
  filters.status = undefined
  query.pageNum = 1
  fetchPage()
}

const openCreate = () => {
  Object.assign(createForm, {
    campaignId: 0,
    userId: 0,
    channel: undefined,
    templateId: undefined,
    email: '',
    variables: '',
    status: 'DRAFT'
  })
  createVisible.value = true
}

const handleCreate = async () => {
  if (!createForm.campaignId || createForm.campaignId <= 0) {
    ElMessage.error('请输入活动ID')
    return
  }
  if (!createForm.userId || createForm.userId <= 0) {
    ElMessage.error('请输入用户ID')
    return
  }
  saving.value = true
  try {
    await createCampaignPush(createForm)
    ElMessage.success('创建成功')
    createVisible.value = false
    fetchPage()
  } catch (e: any) {
    ElMessage.error(e?.msg || '创建失败')
  } finally {
    saving.value = false
  }
}

const openEdit = (row: CampaignPushVO) => {
  currentRecord.value = row
  Object.assign(editForm, {
    campaignId: row.campaignId,
    userId: row.userId,
    channel: row.channel,
    templateId: row.templateId,
    email: row.email || '',
    variables: row.variables || '',
    status: row.status
  })
  editVisible.value = true
}

const handleUpdate = async () => {
  if (!currentRecord.value) return
  saving.value = true
  try {
    await updateCampaignPush(currentRecord.value.id, editForm)
    ElMessage.success('更新成功')
    editVisible.value = false
    fetchPage()
  } catch (e: any) {
    ElMessage.error(e?.msg || '更新失败')
  } finally {
    saving.value = false
  }
}

const viewDetail = (row: CampaignPushVO) => {
  currentRecord.value = row
  detailVisible.value = true
}

const confirmDelete = async (row: CampaignPushVO) => {
  try {
    await ElMessageBox.confirm(`确认删除推送记录 #${row.id} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteCampaignPush(row.id)
    ElMessage.success('删除成功')
    fetchPage()
  } catch (e: any) {
    ElMessage.error(e?.msg || '删除失败')
  }
}

onMounted(() => {
  fetchPage()
})
</script>

<style scoped>
.campaign-push-records-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.search-filters {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
