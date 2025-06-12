<template>
  <div class="role-management-page">
    <h2>角色管理</h2>
    <el-button type="success" style="margin-bottom: 16px;">新增角色</el-button>
    <el-table :data="roles" style="width: 100%">
      <el-table-column prop="roleName" label="角色名" width="180" />
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small">编辑</el-button>
          <el-button size="small" type="danger">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const roles = ref([
  { roleName: '管理员', description: '拥有所有权限' },
  { roleName: '普通用户', description: '只能查看部分内容' }
])
</script>

<style scoped>
.role-management-page {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
</style> 