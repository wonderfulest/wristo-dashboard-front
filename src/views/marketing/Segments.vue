<template>
  <div class="segments-page">
    <div class="page-header">
      <h2>用户分群</h2>
      <div style="display:flex; gap:8px;">
        <el-button @click="handleRefreshAll">刷新全部</el-button>
        <el-button type="success" @click="openCreate">新增分群</el-button>
      </div>
    </div>

    <div class="filters">
      <el-input v-model="query.name" placeholder="按名称搜索" clearable style="width: 200px; margin-right: 12px;" />
      <el-input v-model="query.code" placeholder="按编码搜索" clearable style="width: 200px; margin-right: 12px;" />
      <el-input v-model="query.category" placeholder="按分类搜索" clearable style="width: 200px; margin-right: 12px;" />
      <el-input v-model="query.type" placeholder="按类型搜索" clearable style="width: 200px; margin-right: 12px;" />
      <el-select v-model="query.status" clearable placeholder="状态" style="width: 140px; margin-right: 12px;">
        <el-option :value="1" label="启用" />
        <el-option :value="0" label="禁用" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="list" style="width: 100%" :loading="loading" :default-sort="defaultSort" @sort-change="handleSortChange">
      <el-table-column prop="id" label="ID" width="80" sortable="custom" />
      <el-table-column prop="name" label="名称" min-width="160" sortable="custom" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="180" sortable="custom">
        <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="420">
        <template #default="scope">
          <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
          <el-button size="small" @click="handleRefreshOne(scope.row)">刷新</el-button>
          <el-button
            v-if="scope.row.status === 0"
            size="small"
            type="success"
            @click="handleActivate(scope.row)"
          >启用</el-button>
          <el-button
            v-else
            size="small"
            type="warning"
            @click="handleDeactivate(scope.row)"
          >停用</el-button>
          <el-popconfirm title="确定删除该分群吗？" @confirm="doDelete(scope.row)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
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

    <SegmentEditorDialog
      v-model:visible="dialogVisible"
      :isEdit="isEdit"
      :initial="initialForEditor"
      @submit="onEditorSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { pageSegments, createSegment, updateSegment, deleteSegment, refreshAllSegments, refreshSegment, activateSegment, deactivateSegment, type SegmentVO, type SegmentCreateDTO, type SegmentUpdateDTO } from '@/api/segment'
import { formatDateTime } from '@/utils/date'
import SegmentEditorDialog from '@/views/marketing/components/SegmentEditorDialog.vue'

const loading = ref(false)
const list = ref<SegmentVO[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref<number | null>(null)
const initialForEditor = ref<Partial<SegmentVO> | null>(null)

const defaultSort = ref<{ prop: string; order: 'ascending' | 'descending' }>({ prop: 'id', order: 'descending' })

const query = ref({
  pageNum: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  code: undefined as string | undefined,
  category: undefined as string | undefined,
  type: undefined as string | undefined,
  status: undefined as number | undefined,
  orderBy: 'id desc' as string | undefined,
})

// moved to SegmentEditorDialog

const fetchPage = async () => {
  loading.value = true
  try {
    const res = await pageSegments(query.value)
    if (res.code === 0 && res.data) {
      list.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取分群列表失败')
    }
  } catch (e) {
    ElMessage.error('获取分群列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.value.pageNum = 1
  fetchPage()
}

const handleReset = () => {
  const size = query.value.pageSize
  query.value = { pageNum: 1, pageSize: size, name: undefined, code: undefined, category: undefined, type: undefined, status: undefined, orderBy: 'id desc' }
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

const openCreate = () => {
  isEdit.value = false
  currentId.value = null
  initialForEditor.value = { name: '', code: '', category: '', type: '', ruleExpr: '', description: '', status: 1 }
  dialogVisible.value = true
}

const openEdit = (row: SegmentVO) => {
  isEdit.value = true
  currentId.value = row.id
  initialForEditor.value = { ...row }
  dialogVisible.value = true
}

const onEditorSubmit = async (payload: { isEdit: boolean; id?: number; create?: SegmentCreateDTO; update?: SegmentUpdateDTO }) => {
  try {
    if (payload.isEdit && payload.id && payload.update) {
      const res = await updateSegment(payload.id, payload.update)
      if (res.code === 0) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        fetchPage()
      }
    } else if (!payload.isEdit && payload.create) {
      const res = await createSegment(payload.create)
      if (res.code === 0) {
        ElMessage.success('创建成功')
        dialogVisible.value = false
        fetchPage()
      }
    }
  } catch {}
}

const doDelete = async (row: SegmentVO) => {
  try {
    const res = await deleteSegment(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchPage()
    }
  } catch {}
}

onMounted(() => {
  fetchPage()
})

// 刷新相关
const handleRefreshAll = async () => {
  try {
    await refreshAllSegments()
    ElMessage.success('已触发刷新全部分群')
  } catch {}
}
const handleRefreshOne = async (row: SegmentVO) => {
  try {
    await refreshSegment(row.id)
    ElMessage.success('已触发刷新')
  } catch {}
}

const handleActivate = async (row: SegmentVO) => {
  try {
    const res = await activateSegment(row.id)
    if (res.code === 0) {
      ElMessage.success('已启用')
      fetchPage()
    }
  } catch {}
}

const handleDeactivate = async (row: SegmentVO) => {
  try {
    const res = await deactivateSegment(row.id)
    if (res.code === 0) {
      ElMessage.success('已停用')
      fetchPage()
    }
  } catch {}
}

</script>

<style scoped>
.segments-page {
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
