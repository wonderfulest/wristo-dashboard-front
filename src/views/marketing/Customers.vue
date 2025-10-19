<template>
  <div class="customers-page">
    <div class="page-header">
      <h2>客户管理</h2>
    </div>

    <div class="filters">
      <el-input v-model="query.username" placeholder="按用户名搜索" clearable style="width: 220px; margin-right: 12px;" />
      <el-input v-model="query.email" placeholder="按邮箱搜索" clearable style="width: 260px; margin-right: 12px;" />
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="warning" @click="openSync" style="margin-left: 8px;">同步 Paddle 客户</el-button>
    </div>

    <el-table :data="list" style="width: 100%" :loading="loading" :default-sort="defaultSort" @sort-change="handleSortChange">
      <el-table-column prop="id" label="ID" width="80" sortable="custom" />
      <el-table-column prop="username" label="用户名" min-width="180" sortable="custom" />
      <el-table-column prop="nickname" label="昵称" min-width="160" sortable="custom" />
      <el-table-column prop="email" label="邮箱" min-width="240" sortable="custom" />
      <el-table-column prop="roles" label="角色" :formatter="roleFormatter" />
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

    <el-dialog v-model="syncDialogVisible" title="同步 Paddle Customers" width="520">
      <el-form :model="syncForm" label-width="120px">
        <el-form-item label="After 游标">
          <el-input v-model="syncForm.after" placeholder="可选：上次返回的 after" />
        </el-form-item>
        <el-form-item label="每页数量 perPage">
          <el-input-number v-model="syncForm.perPage" :min="1" :max="200" :step="10" />
        </el-form-item>
        <el-form-item label="拉取页数 pages">
          <el-input-number v-model="syncForm.pages" :min="1" :max="50" />
        </el-form-item>
        <el-alert
          v-if="lastSyncResult"
          :title="`本次创建：${lastSyncResult.created}，下一游标：${lastSyncResult.after || '-'}。可继续使用该游标增量同步。`"
          type="success"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button @click="syncDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="syncLoading" @click="doSync">开始同步</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { pageUsers, syncPaddleCustomers, type SyncPaddleCustomersResult } from '@/api/user'
import type { UserInfo } from '@/types/api'
import type { UserPageQueryDTO } from '@/api/user'

const loading = ref(false)
const list = ref<UserInfo[]>([])
const total = ref(0)
const defaultSort = ref<{ prop: string; order: 'ascending' | 'descending' }>({ prop: 'id', order: 'descending' })

const query = ref<UserPageQueryDTO>({
  pageNum: 1,
  pageSize: 10,
  username: undefined,
  email: undefined,
  roleId: undefined,
  orderBy: 'id desc',
})

const roleFormatter = (row: any) => {
  if (Array.isArray(row.roles)) {
    if (row.roles.length > 0 && typeof row.roles[0] === 'object') {
      return row.roles.map((r: any) => r.roleName).join(', ')
    }
    return row.roles.join(', ')
  }
  return ''
}

const fetchPage = async () => {
  loading.value = true
  try {
    const res = await pageUsers(query.value)
    if (res.code === 0 && res.data) {
      list.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取客户列表失败')
    }
  } catch (e) {
    ElMessage.error('获取客户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.value.pageNum = 1
  fetchPage()
}

const handleReset = () => {
  query.value = { pageNum: 1, pageSize: query.value.pageSize, username: undefined, email: undefined, roleId: undefined, orderBy: 'id desc' }
  fetchPage()
}

const handlePageChange = (page: number) => {
  query.value.pageNum = page
  fetchPage()
}

const handleSizeChange = (size: number) => {
  query.value.pageSize = size
  query.value.pageNum = 1
  fetchPage()
}

const handleSortChange = (payload: { column: any; prop: string; order: 'ascending' | 'descending' | null }) => {
  const { prop, order } = payload || ({} as any)
  if (!order || !prop) {
    query.value.orderBy = undefined
  } else {
    const dir = order === 'ascending' ? 'asc' : 'desc'
    query.value.orderBy = `${prop} ${dir}`
  }
  query.value.pageNum = 1
  fetchPage()
}

onMounted(fetchPage)

// 同步 Paddle Customers
const syncDialogVisible = ref(false)
const syncLoading = ref(false)
const lastSyncResult = ref<SyncPaddleCustomersResult | null>(null)
const syncForm = ref<{ after?: string; perPage?: number; pages?: number }>({ perPage: 50, pages: 10 })

const openSync = () => {
  syncDialogVisible.value = true
}

const doSync = async () => {
  syncLoading.value = true
  try {
    const res = await syncPaddleCustomers({
      after: syncForm.value.after || undefined,
      perPage: syncForm.value.perPage,
      pages: syncForm.value.pages,
    })
    if (res.code === 0 && res.data) {
      lastSyncResult.value = res.data
      if (res.data.after) syncForm.value.after = res.data.after
      ElMessage.success(`同步完成，新建 ${res.data.created} 个用户`)
      // 重新加载列表，查看新增效果
      fetchPage()
    } else {
      ElMessage.error(res.msg || '同步失败')
    }
  } finally {
    syncLoading.value = false
  }
}
</script>

<style scoped>
.customers-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.page-header h2 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.filters {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
