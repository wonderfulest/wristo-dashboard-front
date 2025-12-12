<template>
  <div class="analog-assets-container">
    <div class="header">
      <h2>指针素材管理</h2>
      <div class="tools">
        <el-select v-model="queryType" placeholder="素材类型" clearable style="width: 140px" @change="handleSearch">
          <el-option label="全部" value="" />
          <el-option
            v-for="opt in analogAssetTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <UserSelect v-model="queryUserId" @change="handleSearch" :role-authorities="['ROLE_DESIGNER']"/>
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
          <el-option label="创建时间倒序" value="createdAt:desc" />
          <el-option label="创建时间升序" value="createdAt:asc" />
          <el-option label="更新时间倒序" value="updatedAt:desc" />
          <el-option label="更新时间升序" value="updatedAt:asc" />
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
          <el-popover
            v-if="row.file?.url"
            placement="right"
            trigger="hover"
            :width="260"
            popper-class="preview-popover"
          >
            <template #reference>
              <div class="preview-box">
                <el-image
                  :src="row.file?.url"
                  fit="contain"
                  :preview-src-list="[row.file?.url]"
                  class="preview-image"
                />
              </div>
            </template>
            <div class="preview-box-large">
              <el-image
                :src="row.file?.url"
                fit="contain"
                :preview-src-list="[row.file?.url]"
                class="preview-image-large"
              />
            </div>
          </el-popover>
          <span v-else class="no-preview">-</span>
        </template>
      </el-table-column>
      <el-table-column label="素材类型" width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ getTypeLabel(row.analogAssetType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创作者" width="160">
        <template #default="{ row }">
          <span v-if="row.author">{{ row.author.nickname || row.author.username || row.author.id }}</span>
          <span v-else class="no-preview">-</span>
        </template>
      </el-table-column>
      <el-table-column label="系统素材" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.isSystem"
            :loading="row._sysSwitching"
            @change="(val: boolean) => handleToggleSystem(row, val)"
          />
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
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  pageAnalogAsset,
  updateAnalogAsset,
  removeAnalogAsset,
  setAnalogAssetSystem
} from '@/api/analog-asset'
import { useEnumStore, ANALOG_ASSET_TYPE_ENUM_NAME } from '@/store/common'
import type { AnalogAssetVO, AnalogAssetType } from '@/types/analog-asset'
import AnalogAssetEditDialog from './components/AnalogAssetEditDialog.vue'
import UserSelect from '@/components/users/UserSelect.vue'

// List state
const loading = ref(false)
const list = ref<(AnalogAssetVO & { _switching?: boolean; _sysSwitching?: boolean })[]>([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 枚举选项（来自通用枚举 store）
const enumStore = useEnumStore()
const analogAssetTypeOptions = computed<{ value: AnalogAssetType; label: string }[]>(() => {
  const list = enumStore.getOptions(ANALOG_ASSET_TYPE_ENUM_NAME)
  return list.map(item => ({
    value: item.value as AnalogAssetType,
    label: item.name
  }))
})

// Query filters
const queryType = ref<AnalogAssetType | ''>('')
const queryUserId = ref<number | undefined>(undefined)
const queryIsSystem = ref<'true' | 'false' | ''>('')
const queryIsActive = ref<'true' | 'false' | ''>('')
const sortOrder = ref('updatedAt:desc')

// Dialog state
const dialogVisible = ref(false)
const editingAsset = ref<AnalogAssetVO | null>(null)

// Helpers
const getTypeLabel = (type: AnalogAssetType) => {
  return analogAssetTypeOptions.value.find(o => o.value === type)?.label || type
}

// Fetch list
const fetchPage = async () => {
  loading.value = true
  try {
    const res = await pageAnalogAsset({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      analogAssetType: queryType.value || undefined,
      userId: queryUserId.value,
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

// Toggle isSystem
const handleToggleSystem = async (
  row: AnalogAssetVO & { _sysSwitching?: boolean },
  val: boolean
) => {
  row._sysSwitching = true
  try {
    const res = await setAnalogAssetSystem(row.id, val)
    if (res.code === 0) {
      ElMessage.success(val ? '已设为系统素材' : '已设为用户素材')
    } else {
      row.isSystem = !val
    }
  } catch {
    row.isSystem = !val
    ElMessage.error('操作失败')
  } finally {
    row._sysSwitching = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchPage()
}

const handleReset = () => {
  queryType.value = ''
  queryUserId.value = undefined
  queryIsSystem.value = ''
  queryIsActive.value = ''
  sortOrder.value = 'id:desc'
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

onMounted(() => {
  enumStore.ensureOptions(ANALOG_ASSET_TYPE_ENUM_NAME)
  fetchPage()
})
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

.preview-box {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e3e6ed;
  background-image:
    linear-gradient(45deg, #b8bcc7 25%, transparent 25%, transparent 75%, #b8bcc7 75%, #b8bcc7),
    linear-gradient(45deg, #b8bcc7 25%, transparent 25%, transparent 75%, #b8bcc7 75%, #b8bcc7);
  background-size: 8px 8px;
  background-position: 0 0, 4px 4px;
}

.preview-image :deep(img) {
  transition: transform 0.2s ease-out, filter 0.2s ease-out;
  /* 强化白色内容的边缘对比度 */
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
}

.preview-box:hover :deep(img) {
  transform: scale(1.2);
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.7));
}

.preview-popover {
  padding: 8px !important;
}

.preview-box-large {
  width: 240px;
  height: 240px;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #dde1eb;
  background-image:
    linear-gradient(45deg, #aeb3c0 25%, transparent 25%, transparent 75%, #aeb3c0 75%, #aeb3c0),
    linear-gradient(45deg, #aeb3c0 25%, transparent 25%, transparent 75%, #aeb3c0 75%, #aeb3c0);
  background-size: 10px 10px;
  background-position: 0 0, 5px 5px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
}

.preview-image-large :deep(img) {
  max-width: 100%;
  max-height: 100%;
  /* 大图同样增强白色边缘对比度 */
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.7));
}

</style>
