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
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="users" style="width: 100%" :loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="180" />
      <el-table-column prop="nickname" label="昵称" width="180" />
      <el-table-column prop="email" label="邮箱" width="260" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { pageMerchantUsers, type MerchantUserPageQueryDTO } from '@/api/user'
import type { UserInfo } from '@/types/api'

const users = ref<UserInfo[]>([])
const loading = ref(false)
const total = ref(0)

const query = ref<MerchantUserPageQueryDTO>({
  pageNum: 1,
  pageSize: 20,
  orderBy: 'id desc',
  username: undefined,
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
  query.value = { pageNum: 1, pageSize: query.value.pageSize, orderBy: 'id desc' }
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
