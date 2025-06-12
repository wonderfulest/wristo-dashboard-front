<template>
  <div class="role-management-page">
    <h2>角色管理</h2>
    <el-button type="success" style="margin-bottom: 16px;" @click="handleAdd">新增角色</el-button>
    <el-table :data="roles" style="width: 100%" :loading="loading">
      <el-table-column prop="roleName" label="角色名" width="180" />
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新增角色'">
      <el-form :model="currentRole" label-width="80px">
        <el-form-item label="角色名">
          <el-input v-model="currentRole.roleName" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="currentRole.description" />
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
import { getRoleList, createRole, updateRole, deleteRole } from '@/api/role'
import type { RoleInfo } from '@/types/api'

const roles = ref<RoleInfo[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentRole = ref<Partial<RoleInfo>>({})

const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await getRoleList()
    if (res.code === 0 && res.data) {
      roles.value = res.data
    } else {
      ElMessage.error(res.msg || '获取角色列表失败')
    }
  } catch (e) {
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  currentRole.value = {}
  dialogVisible.value = true
}

const handleEdit = (row: RoleInfo) => {
  isEdit.value = true
  currentRole.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (row: RoleInfo) => {
  ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
    type: 'warning',
  }).then(async () => {
    const res = await deleteRole(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchRoles()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  })
}

const handleSave = async () => {
  if (!currentRole.value.roleName) {
    ElMessage.error('角色名不能为空')
    return
  }
  let res
  if (isEdit.value && currentRole.value.id) {
    res = await updateRole(currentRole.value.id, {
      roleName: currentRole.value.roleName,
      description: currentRole.value.description || ''
    })
  } else {
    res = await createRole({
      roleName: currentRole.value.roleName,
      description: currentRole.value.description || ''
    })
  }
  if (res.code === 0) {
    ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    fetchRoles()
  } else {
    ElMessage.error(res.msg || (isEdit.value ? '编辑失败' : '新增失败'))
  }
}

onMounted(fetchRoles)
</script>

<style scoped>
.role-management-page {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
</style> 