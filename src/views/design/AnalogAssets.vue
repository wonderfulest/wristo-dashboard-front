<template>
  <div class="analog-assets-container">
    <div class="header">
      <h2>指针素材管理</h2>
      <div class="tools">
        <el-select v-model="queryType" placeholder="素材类型" clearable style="width: 140px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option v-for="opt in AnalogAssetTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-select v-model="queryIsSystem" placeholder="是否系统" clearable style="width: 140px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="系统素材" value="true" />
          <el-option label="用户素材" value="false" />
        </el-select>
        <el-select v-model="queryIsActive" placeholder="启用状态" clearable style="width: 140px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option label="启用" value="true" />
          <el-option label="禁用" value="false" />
        </el-select>
        <el-select v-model="sortOrder" placeholder="排序" style="width: 180px" @change="handleSearch">
          <el-option label="ID倒序" value="id desc" />
          <el-option label="ID升序" value="id asc" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" @click="openCreate">新建素材</el-button>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" class="analog-table">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="预览" width="120">
        <template #default="{ row }">
          <el-image
            v-if="row.file?.url"
            :src="row.file?.url"
            fit="contain"
            style="width: 80px; height: 80px; background: #f5f7fa; border-radius: 8px;"
            :preview-src-list="[row.file?.url]"
          />
          <span v-else class="no-preview">-</span>
        </template>
      </el-table-column>
      <el-table-column label="素材类型" width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ getTypeLabel(row.analogAssetType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="系统素材" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isSystem ? 'success' : 'info'" size="small">
            {{ row.isSystem ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="删除" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.isDeleted" type="danger" size="small">已删除</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="启用" width="80">
        <template #default="{ row }">
          <el-switch
            v-model="row.isActive"
            :loading="row._switching"
            @change="(val: boolean) => handleToggleActive(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="version" label="版本" width="80" />
      <el-table-column fixed="right" label="操作" width="200">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="primary" link @click="openPreview(row)" :disabled="!row.file?.url">预览</el-button>
          <el-popconfirm title="确定删除该素材吗？" @confirm="doDelete(row)">
            <template #reference>
              <el-button type="danger" link>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <AnalogAssetEditDialog
      v-model="dialogVisible"
      :asset="editingAsset"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  pageAnalogAsset,
  updateAnalogAsset,
  removeAnalogAsset
} from '@/api/analog-asset'
import type { AnalogAssetVO, AnalogAssetType } from '@/types/analog-asset'
import { AnalogAssetTypeOptions } from '@/types/analog-asset'
import AnalogAssetEditDialog from './components/AnalogAssetEditDialog.vue'

// List state
const loading = ref(false)
const list = ref<(AnalogAssetVO & { _switching?: boolean })[]>([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// Query filters
const queryType = ref<AnalogAssetType | ''>('')
const queryIsSystem = ref<'true' | 'false' | ''>('')
const queryIsActive = ref<'true' | 'false' | ''>('')
const sortOrder = ref('id desc')

// Dialog state
const dialogVisible = ref(false)
const editingAsset = ref<AnalogAssetVO | null>(null)

// Helpers
const getTypeLabel = (type: AnalogAssetType) => {
  return AnalogAssetTypeOptions.find(o => o.value === type)?.label || type
}

// Fetch
const fetchPage = async () => {
  loading.value = true
  try {
    const res = await pageAnalogAsset({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      analogAssetType: queryType.value || undefined,
      isSystem: queryIsSystem.value === '' ? undefined : queryIsSystem.value === 'true',
      isActive: queryIsActive.value === '' ? undefined : queryIsActive.value === 'true',
      orderBy: sortOrder.value
    })
    if (res.code === 0 && res.data) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (e) {
    ElMessage.error('获取素材列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchPage()
}

const handleReset = () => {
  queryType.value = ''
  queryIsSystem.value = ''
  queryIsActive.value = ''
  sortOrder.value = 'id desc'
  pageNum.value = 1
  fetchPage()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchPage()
}

const handleCurrentChange = (page: number) => {
  pageNum.value = page
  fetchPage()
}

// Toggle active
const handleToggleActive = async (row: AnalogAssetVO & { _switching?: boolean }, val: boolean) => {
  row._switching = true
  try {
    const res = await updateAnalogAsset({ id: row.id, isActive: val })
    if (res.code === 0) {
      ElMessage.success(val ? '已启用' : '已禁用')
    } else {
      row.isActive = !val
    }
  } catch {
    row.isActive = !val
    ElMessage.error('操作失败')
  } finally {
    row._switching = false
  }
}

// Create
const openCreate = () => {
  editingAsset.value = null
  dialogVisible.value = true
}

// Edit
const openEdit = (row: AnalogAssetVO) => {
  editingAsset.value = row
  dialogVisible.value = true
}

// Preview
const openPreview = (row: AnalogAssetVO) => {
  if (row.file?.url) {
    window.open(row.file.url, '_blank')
  }
}

// Delete
const doDelete = async (row: AnalogAssetVO) => {
  try {
    const res = await removeAnalogAsset(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchPage()
    }
  } catch {
    ElMessage.error('删除失败')
  }
}

// Dialog saved callback
const onSaved = () => {
  fetchPage()
}

onMounted(fetchPage)
</script>

<style scoped>
.analog-assets-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.header h2 {
  margin: 0;
}

.tools {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.no-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #909399;
}

.analog-table {
  width: 100%;
}

</style>
