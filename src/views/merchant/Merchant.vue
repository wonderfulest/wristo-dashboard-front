<template>
  <div class="merchant-page">
    <div class="page-header">
      <h2>商家用户</h2>
    </div>

    <div class="filters">
      <el-input
        v-model="query.username"
        placeholder="按用户名搜索"
        clearable
        style="width: 220px; margin-right: 12px;"
      />
      <el-input
        v-model="query.email"
        placeholder="按邮箱搜索"
        clearable
        style="width: 260px; margin-right: 12px;"
      />
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="users" style="width: 100%" :loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="180" />
      <el-table-column prop="nickname" label="昵称" width="180" />
      <el-table-column prop="email" label="邮箱" width="260" />
      <el-table-column prop="roles" label="角色" :formatter="roleFormatter" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openDesignerConfig(row)">查看默认配置</el-button>
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

    <!-- 设计师默认配置对话框 -->
    <el-dialog v-model="configDialogVisible" title="设计师默认配置" width="560px">
      <div v-if="configLoading" style="padding: 12px;">加载中...</div>
      <el-descriptions v-else :column="2" border size="small">
        <el-descriptions-item label="用户ID">{{ currentConfig?.userId ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="启用">{{ currentConfig?.isActive === 1 ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="默认支付">{{ currentConfig?.defaultPaymentMethod || '-' }}</el-descriptions-item>
        <el-descriptions-item label="自动发布">{{ currentConfig?.enableAutoPublish === 1 ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="默认价格">{{ currentConfig?.defaultPrice ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="默认币种">{{ currentConfig?.defaultCurrency || '-' }}</el-descriptions-item>
        <el-descriptions-item label="描述模板" :span="2"><div style="white-space: pre-wrap;">{{ currentConfig?.descriptionTemplate || '-' }}</div></el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentConfig?.createdAt || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentConfig?.updatedAt || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="configDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { pageMerchantUsers, type MerchantUserPageQueryDTO } from '@/api/user'
import type { UserInfo } from '@/types/api'
import { getDesignerDefaultConfigByUser } from '@/api/designer-default-config'
import type { DesignerDefaultConfigVO } from '@/types/designer-default-config'

const users = ref<UserInfo[]>([])
const loading = ref(false)
const total = ref(0)

const query = ref<MerchantUserPageQueryDTO>({
  pageNum: 1,
  pageSize: 20,
  orderBy: 'id desc',
  username: undefined,
  email: undefined,
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

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await pageMerchantUsers(query.value)
    if (res.code === 0 && res.data) {
      users.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取商家用户失败')
    }
  } catch (e) {
    ElMessage.error('获取商家用户失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.value.pageNum = 1
  fetchUsers()
}

const handleReset = () => {
  query.value = { pageNum: 1, pageSize: query.value.pageSize, orderBy: 'id desc', username: undefined, email: undefined }
  fetchUsers()
}

const handlePageChange = (page: number) => {
  query.value.pageNum = page
  fetchUsers()
}

const handleSizeChange = (size: number) => {
  query.value.pageSize = size
  query.value.pageNum = 1
  fetchUsers()
}

// 查看设计师默认配置
const configDialogVisible = ref(false)
const configLoading = ref(false)
const currentConfig = ref<DesignerDefaultConfigVO | null>(null)

const openDesignerConfig = async (row: any) => {
  if (!row?.id) return
  configDialogVisible.value = true
  configLoading.value = true
  currentConfig.value = null
  try {
    const res = await getDesignerDefaultConfigByUser(Number(row.id))
    if (res.code === 0) {
      currentConfig.value = res.data || null
      if (!currentConfig.value) {
        ElMessage.info('未找到默认配置')
      }
    } else {
      ElMessage.error(res.msg || '获取默认配置失败')
    }
  } catch (e: any) {
    const msg = e?.msg || e?.message || ''
    if (e?.code === -1 && /not found|不存在/i.test(msg)) {
      currentConfig.value = null
      ElMessage.info('未找到默认配置')
    } else {
      ElMessage.error(msg || '获取默认配置失败')
    }
  } finally {
    configLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.merchant-page {
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

.filters {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.el-table {
  flex: 1;
  margin-bottom: 16px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
}
</style>
