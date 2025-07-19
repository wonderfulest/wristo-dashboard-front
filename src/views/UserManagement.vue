<template>
  <div class="user-management-page">
    <h2>用户管理</h2>
    <el-button type="success" style="margin-bottom: 16px;" @click="handleAdd">新增用户</el-button>
    <el-table :data="users" style="width: 100%" :loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="180" />
      <el-table-column prop="nickname" label="昵称" width="180" />
      <el-table-column prop="email" label="邮箱" width="220" />
      <el-table-column prop="roles" label="角色" :formatter="roleFormatter" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
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
import { getUserList, createUser, updateUser, deleteUser } from '@/api/user'
import { getRoleList } from '@/api/role'
import type { UserInfo, RoleInfo } from '@/types/api'
import type { UserUpdateDTO } from '@/types/user'

const users = ref<UserInfo[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentUser = ref<Partial<UserInfo> & { roles?: string | string[] }>({})
const rolesInput = ref<string[]>([])
const password = ref('')
const roleOptions = ref<RoleInfo[]>([])

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
    const res = await getUserList()
    if (res.code === 0 && res.data) {
      users.value = res.data
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
    if (row.roles.length > 0 && typeof row.roles[0] === 'object') {
      rolesInput.value = row.roles.map((r: any) => r.roleCode)
    } else {
      rolesInput.value = row.roles.slice()
    }
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
      status: currentUser.value.status ? parseInt(currentUser.value.status) : undefined,
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
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
</style> 