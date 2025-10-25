<template>
  <div class="unsupport-container">
    <div class="header">
      <h2>未支持应用列表</h2>
      <div class="filters">
        <el-select
          v-model="selectedDevice"
          value-key="id"
          placeholder="选择设备型号（支持名称模糊搜索）"
          filterable
          remote
          :remote-method="searchDevices"
          :loading="deviceLoading"
          clearable
          style="width: 320px"
          @visible-change="(v:boolean)=>{ if(v) { searchDevices(searchKeyword); ensureSelectedInOptions() } }"
          @change="onDeviceSelected"
        >
          <el-option
            v-for="d in deviceOptions"
            :key="d.id"
            :label="d.displayName"
            :value="d"
          />
        </el-select>
        <el-select v-model="sortOrder" placeholder="排序" style="width: 180px">
          <el-option label="下载量倒序" value="download:desc" />
          <el-option label="下载量升序" value="download:asc" />
          <el-option label="创建时间倒序" value="created_at:desc" />
          <el-option label="创建时间升序" value="created_at:asc" />
        </el-select>
        <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
      </div>
    </div>

    <el-alert v-if="!deviceId" type="info" show-icon title="请选择设备后进行查询" class="tip" />

    <el-table :data="list" v-loading="loading" style="width: 100%" size="small">
      <el-table-column prop="appId" label="ID" width="80" />
      <el-table-column label="应用" min-width="300">
        <template #default="{ row }">
          <div class="product-info">
            <el-image
              v-if="row.garminImageUrl || row.heroFile?.url"
              :src="row.garminImageUrl || row.heroFile?.url"
              :z-index="5000"
              :preview-src-list="[row.garminImageUrl || row.heroFile?.url]"
              :preview-teleported="true"
              fit="cover"
              class="product-thumb"
              style="width: 48px; height: 48px"
            />
            <div class="product-meta">
              <div class="product-name">
                <a v-if="row.garminStoreUrl" :href="row.garminStoreUrl" target="_blank" rel="noopener noreferrer">{{ row.name }}</a>
                <span v-else>{{ row.name }}</span>
                <a
                  v-if="row.designId"
                  :href="'https://studio.wristo.io/design?id=' + row.designId"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="margin-left: 8px"
                >
                  <el-button link type="primary" size="small">
                    <el-icon><EditPen /></el-icon>
                  </el-button>
                </a>
              </div>
              <div class="product-details">
                <span>appId: {{ row.appId }}</span>
                <span>设计ID: {{ row.designId }}</span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="作者" width="120">
        <template #default="{ row }">{{ row.user?.username || '-' }}</template>
      </el-table-column>
      <el-table-column prop="download" label="下载量" width="100" />
      <el-table-column prop="price" label="价格" width="90">
        <template #default="{ row }">${{ row.price }}</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openCreateTicket(row)">创建工单</el-button>
        </template>
      </el-table-column>
      
    </el-table>

    <!-- 创建工单弹窗 -->
    <el-dialog v-model="ticketDialogVisible" title="创建工单" width="600px">
      <el-form :model="ticketForm" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="ticketForm.title" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="ticketForm.priority" placeholder="选择优先级" style="width: 180px">
            <el-option label="Low" value="low" />
            <el-option label="Medium" value="medium" />
            <el-option label="High" value="high" />
            <el-option label="Urgent" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派人">
          <div style="display:flex; gap:8px; align-items:center; width:100%">
            <span v-if="assigneeLoading" style="color:#6c757d; font-size:12px">加载中…</span>
            <span v-else-if="assigneeDetail" style="color:#495057; font-size:14px; font-weight:500">
              {{ assigneeDetail.username }}
              <span v-if="assigneeDetail.email" style="color:#6c757d; font-weight:400">（{{ assigneeDetail.email }}）</span>
            </span>
            <span v-else style="color:#6c757d; font-size:12px">—</span>
          </div>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="ticketForm.dueDate" type="datetime" placeholder="选择日期时间" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="tagsSelected" multiple filterable placeholder="选择标签" style="width: 100%">
            <el-option
              v-for="t in tagsOptions"
              :key="t"
              :label="t"
              :value="t"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="ticketForm.description" type="textarea" rows="4" placeholder="请填写工单描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="ticketDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="ticketSubmitting" @click="submitCreateTicket">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <div class="pagination">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="onSizeChange"
        @current-change="onPageChange"
      />
    </div>

    
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchUnSupportByDevicePage } from '@/api/products'
import { pageGarminDevices } from '@/api/garmin-device'
import type { Product } from '@/types/product'
import { formatDate } from '@/utils/date'
import { createTicket, fetchTicketTags } from '@/api/ticket'
import { getUserDetail } from '@/api/user'
import { useUserStore } from '@/store/user'
import type { UserInfo } from '@/types/api'
import type { TicketCreateDTO } from '@/types/api'
import { EditPen } from '@element-plus/icons-vue'
 

const userStore = useUserStore()

// Local form model to ensure nullable IDs are allowed during editing
type TicketFormModel = {
  title: string
  description?: string
  priority?: string
  assigneeId?: number | null
  creatorId?: number | null
  dueDate?: string | null
  tags?: string | null
  attachments?: string | null
  productId?: number | null
}

const deviceId = ref<number | null>(null)
const selectedDevice = ref<any | null>(null)
const sortOrder = ref('download:desc')
const loading = ref(false)
const list = ref<Product[]>([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// device dropdown
const deviceOptions = ref<any[]>([])
const deviceLoading = ref(false)
const searchTimer = ref<number | undefined>(undefined)
const searchKeyword = ref('')

const searchDevices = (query: string) => {
  searchKeyword.value = query
  if (searchTimer.value) window.clearTimeout(searchTimer.value)
  deviceLoading.value = true
  searchTimer.value = window.setTimeout(async () => {
    try {
      const resp = await pageGarminDevices({ pageNum: 1, pageSize: 500, orderBy: 'id:desc', displayName: query || undefined })
      const data: any = (resp as any)?.data
      deviceOptions.value = data?.list || []
      ensureSelectedInOptions()
    } catch {
      deviceOptions.value = []
    } finally {
      deviceLoading.value = false
    }
  }, 300)
}

function ensureSelectedInOptions() {
  if (!selectedDevice.value) return
  const exists = deviceOptions.value?.some((d:any) => d.id === selectedDevice.value.id)
  if (!exists) deviceOptions.value = [selectedDevice.value, ...(deviceOptions.value || [])]
}

function onDeviceSelected(dev: any) {
  console.log('[DeviceUnSupport] Device selected:', dev)
  deviceId.value = dev?.id ?? null
  console.log('[DeviceUnSupport] deviceId set to:', deviceId.value)
  pageNum.value = 1
  fetchList()
}

const fetchList = async () => {
  if (!deviceId.value) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const res = await fetchUnSupportByDevicePage({
      deviceId: deviceId.value!,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      orderBy: sortOrder.value,
    })
    if (res.code === 0) {
      list.value = res.data?.list || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.msg || '获取数据失败')
    }
  } catch (e) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  pageNum.value = 1
  fetchList()
}

const onSizeChange = (val: number) => {
  pageSize.value = val
  fetchList()
}

const onPageChange = (val: number) => {
  pageNum.value = val
  fetchList()
}

// 创建工单
const ticketDialogVisible = ref(false)
const ticketSubmitting = ref(false)
const ticketForm = ref<TicketFormModel>({
  title: '请求重新设计',
  description: '',
  priority: 'medium',
  assigneeId: null,
  creatorId: null,
  dueDate: null,
  tags: '',
  attachments: null,
  productId: null,
})
const tagsOptions = ref<string[]>([])
const tagsSelected = ref<string[]>([])

function openCreateTicket(row: any) {
  ticketForm.value = {
    title: '请求重新设计',
    description: '',
    priority: 'medium',
    assigneeId: row?.user?.id ?? null,
    creatorId: userStore.userInfo?.id ?? null,
    dueDate: null,
    tags: '',
    attachments: null,
    productId: row?.appId ?? null,
  }
  // 初始化已选标签
  if (ticketForm.value.tags) {
    try {
      const arr = JSON.parse(ticketForm.value.tags)
      tagsSelected.value = Array.isArray(arr) ? arr : []
    } catch {
      tagsSelected.value = []
    }
  } else {
    tagsSelected.value = []
  }
  // 懒加载标签选项
  if (!tagsOptions.value.length) {
    fetchTicketTags().then(res => {
      if (res.code === 0 && res.data) {
        tagsOptions.value = res.data
      }
    })
  }
  // 预加载指派人信息
  if (ticketForm.value.assigneeId) loadAssignee(ticketForm.value.assigneeId)
  ticketDialogVisible.value = true
}

const submitCreateTicket = async () => {
  if (!ticketForm.value.description) {
    ElMessage.error('请填写工单描述')
    return
  }
  if (!userStore.userInfo?.id) {
    ElMessage.error('未获取到当前登录用户信息')
    return
  }
  try {
    ticketSubmitting.value = true
    const payload: TicketFormModel = {
      title: ticketForm.value.title,
      description: ticketForm.value.description,
      priority: ticketForm.value.priority,
      assigneeId: ticketForm.value.assigneeId ?? null,
      creatorId: userStore.userInfo.id,
      dueDate: ticketForm.value.dueDate,
      tags: JSON.stringify(tagsSelected.value || []),
      attachments: ticketForm.value.attachments,
      productId: ticketForm.value.productId ?? null,
    }
    const res = await createTicket(payload as unknown as TicketCreateDTO)
    if (res.code === 0) {
      ElMessage.success('工单已创建')
      ticketDialogVisible.value = false
    } else {
      ElMessage.error(res.msg || '创建失败')
    }
  } catch (e) {
    ElMessage.error('创建失败')
  } finally {
    ticketSubmitting.value = false
  }
}

// 指派人信息联动
const assigneeDetail = ref<UserInfo | null>(null)
const assigneeLoading = ref(false)
async function loadAssignee(id: number) {
  try {
    assigneeLoading.value = true
    assigneeDetail.value = null
    const res = await getUserDetail(id)
    if (res.code === 0 && res.data) assigneeDetail.value = res.data
  } finally {
    assigneeLoading.value = false
  }
}

watch(() => ticketForm.value.assigneeId, (val) => {
  if (typeof val === 'number' && val > 0) {
    loadAssignee(val)
  } else {
    assigneeDetail.value = null
  }
})

</script>

<style scoped>
.unsupport-container { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.filters { display: flex; gap: 12px; align-items: center; }
.tip { margin-bottom: 12px; }
.product-info { display: flex; align-items: center; gap: 12px; }
.product-meta { min-width: 0; }
.product-name { font-weight: 600; color: #333; }
.product-thumb { border-radius: 6px; }
.product-details { display: flex; gap: 10px; font-size: 12px; color: #666; }
.pagination { margin-top: 12px; display: flex; justify-content: flex-end; }
</style>
