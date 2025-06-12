<template>
  <div class="user-management-page">
    <h2>用户管理</h2>
    <el-button type="success" style="margin-bottom: 16px;" @click="handleAdd">新增用户</el-button>
    <el-table :data="users" style="width: 100%" :loading="loading">
      <el-table-column prop="username" label="用户名" width="180" />
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
        <el-form-item label="用户名">
          <el-input v-model="currentUser.username" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="currentUser.email" />
        </el-form-item>
        <el-form-item label="角色">
          <el-input v-model="rolesInput" placeholder="用逗号分隔多个角色" />
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
import type { UserInfo } from '@/types/api'

const users = ref<UserInfo[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentUser = ref<Partial<UserInfo> & { roles?: string | string[] }>({})
const rolesInput = ref('')
const password = ref('')

const roleFormatter = (row: any) => Array.isArray(row.roles) ? row.roles.join(', ') : ''

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

const handleAdd = () => {
  isEdit.value = false
  currentUser.value = {}
  rolesInput.value = ''
  password.value = ''
  dialogVisible.value = true
}

const handleEdit = (row: UserInfo) => {
  isEdit.value = true
  currentUser.value = { ...row }
  rolesInput.value = Array.isArray(row.roles) ? row.roles.join(',') : ''
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
  let payload: any = { ...currentUser.value, roles: rolesInput.value.split(',').map(r => r.trim()).filter(Boolean) }
  if (!isEdit.value) {
    payload.password = password.value
  }
  let res
  if (isEdit.value && currentUser.value.id) {
    res = await updateUser(currentUser.value.id, payload)
  } else {
    res = await createUser(payload)
  }
  if (res.code === 0) {
    ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    fetchUsers()
  } else {
    ElMessage.error(res.msg || (isEdit.value ? '编辑失败' : '新增失败'))
  }
}

onMounted(fetchUsers)
</script>

<style scoped>
.user-management-page {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
</style> 