<template>
  <div class="user-management-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="success" @click="handleAdd">新增用户</el-button>
    </div>
    <div class="filters">
      <UserSelect v-model="searchUserId" placeholder="按用户搜索" @change="handleUserChange" />
      <el-select v-model="query.roleId" clearable filterable placeholder="按角色筛选" style="width: 220px; margin-right: 12px;">
        <el-option v-for="role in roleOptions" :key="role.id" :label="role.roleName" :value="role.id" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>
    <el-table :data="users" style="width: 100%" :loading="loading" :default-sort="defaultSort" @sort-change="handleSortChange">
      <el-table-column prop="id" label="ID" width="60" sortable="custom" />
      <el-table-column prop="username" label="用户名" width="180" sortable="custom" />
      <el-table-column prop="nickname" label="昵称" width="180" sortable="custom" />
      <el-table-column prop="email" label="邮箱" width="280" sortable="custom" />
      <el-table-column prop="roles" label="角色" :formatter="roleFormatter" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'">
      <el-form :model="currentUser" label-width="80px">
        <el-form-item label="ID">
          <el-input v-model="currentUser.id" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="currentUser.username" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="currentUser.nickname" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="currentUser.email" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="rolesInput" multiple filterable placeholder="请选择角色">
            <el-option v-for="role in roleOptions" :key="role.roleCode" :label="role.roleName" :value="role.roleCode" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码">
          <el-input v-model="password" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageUsers, createUser, updateUser, deleteUser } from '@/api/user'
import { getRoleList } from '@/api/role'
import type { UserInfo, RoleInfo } from '@/types/api'
import type { UserUpdateDTO } from '@/types/user'
import type { UserPageQueryDTO } from '@/api/user'
import UserSelect from '@/components/users/UserSelect.vue'

const users = ref<UserInfo[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentUser = ref<Partial<UserInfo>>({})
const rolesInput = ref<string[]>([])
const password = ref('')
const roleOptions = ref<RoleInfo[]>([])
const total = ref(0)
const defaultSort = ref<{ prop: string; order: 'ascending' | 'descending' }>({ prop: 'id', order: 'descending' })

const query = ref<UserPageQueryDTO>({
  pageNum: 1,
  pageSize: 10,
  userId: undefined,
  username: undefined,
  roleId: undefined,
  email: undefined,
  orderBy: 'id desc',
})

const searchUserId = ref<number | undefined>(undefined)

const handleUserChange = (val?: number) => {
  query.value.userId = val
  query.value.pageNum = 1
  fetchUsers()
}

const roleFormatter = (row: any) => {
  if (Array.isArray(row.roles)) {
    // 兼容 roles 为对象数组
    if (row.roles.length > 0 && typeof row.roles[0] === 'object') {
      return row.roles.map((r: any) => r.roleName).join(', ')
    }
    // 兼容 roles 为字符串数组
    return row.roles.join(', ')
  }
  return ''
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await pageUsers(query.value)
    if (res.code === 0 && res.data) {
      users.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取用户列表失败')
    }
  } catch (e) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const res = await getRoleList()
    if (res.code === 0 && res.data) {
      roleOptions.value = res.data
    }
  } catch {}
}

const handleSearch = () => {
  query.value.pageNum = 1
  fetchUsers()
}

const handleReset = () => {
  searchUserId.value = undefined
  query.value = { pageNum: 1, pageSize: query.value.pageSize, userId: undefined, username: undefined, roleId: undefined, email: undefined }
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

const handleSortChange = (payload: { column: any; prop: string; order: 'ascending' | 'descending' | null }) => {
  const { prop, order } = payload || ({} as any)
  if (!order || !prop) {
    query.value.orderBy = undefined
  } else {
    const dir = order === 'ascending' ? 'asc' : 'desc'
    query.value.orderBy = `${prop} ${dir}`
  }
  query.value.pageNum = 1
  fetchUsers()
}

const handleAdd = () => {
  isEdit.value = false
  currentUser.value = {}
  rolesInput.value = []
  password.value = ''
  dialogVisible.value = true
}

const handleEdit = (row: UserInfo) => {
  isEdit.value = true
  currentUser.value = { ...row }
  if (Array.isArray(row.roles)) {
    // 统一将角色映射为 roleCode 字符串数组
    rolesInput.value = (row.roles as RoleInfo[]).map((r: RoleInfo) => r.roleCode)
  } else {
    rolesInput.value = []
  }
  dialogVisible.value = true
}

const handleDelete = (row: UserInfo) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
    type: 'warning',
  }).then(async () => {
    const res = await deleteUser(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchUsers()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  })
}

const handleSave = async () => {
  if (!currentUser.value.username || !currentUser.value.email) {
    ElMessage.error('用户名和邮箱不能为空')
    return
  }
  if (!isEdit.value && !password.value) {
    ElMessage.error('新增用户时密码不能为空')
    return
  }
  
  let res
  if (isEdit.value && currentUser.value.id) {
    // 使用强制的 UserUpdateDTO 类型
    const updatePayload: UserUpdateDTO = {
      username: currentUser.value.username,
      nickname: currentUser.value.nickname || undefined,
      avatar: currentUser.value.avatar || undefined,
      status: currentUser.value.status ?? undefined,
      roles: rolesInput.value
    }
    res = await updateUser(currentUser.value.id, updatePayload)
  } else {
    // 创建用户时使用原有的逻辑
    const createPayload: any = { ...currentUser.value, roles: rolesInput.value }
    createPayload.password = password.value
    res = await createUser(createPayload)
  }
  
  if (res.code === 0) {
    ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    fetchUsers()
  } else {
    ElMessage.error(res.msg || (isEdit.value ? '编辑失败' : '新增失败'))
  }
}

onMounted(() => {
  fetchUsers()
  fetchRoles()
})
</script>

<style scoped>
.user-management-page {
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

.el-table {
  flex: 1;
  margin-bottom: 24px;
}

.el-dialog {
  .el-dialog__body {
    max-height: 60vh;
    overflow-y: auto;
  }
}

.filters {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>