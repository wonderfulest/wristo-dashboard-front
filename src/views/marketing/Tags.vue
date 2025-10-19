<template>
  <div class="tags-page">
    <div class="page-header">
      <h2>标签管理</h2>
      <el-button type="success" @click="openCreate">新增标签</el-button>
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
      <el-table-column prop="code" label="编码" min-width="160" sortable="custom" />
      <el-table-column prop="category" label="分类" min-width="140" sortable="custom" />
      <el-table-column prop="type" label="类型" min-width="120" sortable="custom" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="180" sortable="custom">
        <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
          <el-popconfirm title="确定删除该标签吗？" @confirm="doDelete(scope.row)">
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑标签' : '新增标签'" width="640">
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="编码" required>
          <el-input v-model="form.code" :disabled="isEdit" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="form.type" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="规则表达式">
          <el-input v-model="form.ruleExpr" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 180px;">
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="禁用" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { pageTags, createTag, updateTag, deleteTag, type TagVO, type TagCreateDTO, type TagUpdateDTO } from '@/api/tag'
import { formatDateTime } from '@/utils/date'

const loading = ref(false)
const saving = ref(false)
const list = ref<TagVO[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref<number | null>(null)

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

const form = ref<TagCreateDTO>({
  name: '',
  code: '',
  category: '',
  type: '',
  ruleExpr: '',
  description: '',
  status: 1,
})

const fetchPage = async () => {
  loading.value = true
  try {
    const res = await pageTags(query.value)
    if (res.code === 0 && res.data) {
      list.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取标签列表失败')
    }
  } catch (e) {
    ElMessage.error('获取标签列表失败')
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
  form.value = { name: '', code: '', category: '', type: '', ruleExpr: '', description: '', status: 1 }
  dialogVisible.value = true
}

const openEdit = (row: TagVO) => {
  isEdit.value = true
  currentId.value = row.id
  form.value = {
    name: row.name,
    code: row.code, // disabled in UI
    category: row.category,
    type: row.type,
    ruleExpr: row.ruleExpr,
    description: row.description,
    status: row.status,
  }
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!form.value.name?.trim()) {
    ElMessage.error('名称不能为空')
    return
  }
  if (!isEdit.value && !form.value.code?.trim()) {
    ElMessage.error('编码不能为空')
    return
  }
  saving.value = true
  try {
    if (isEdit.value && currentId.value) {
      const { name, category, type, ruleExpr, description, status } = form.value
      const payload: TagUpdateDTO = { name, category, type, ruleExpr, description, status }
      const res = await updateTag(currentId.value, payload)
      if (res.code === 0) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        fetchPage()
      }
    } else {
      const payload: TagCreateDTO = { ...form.value, code: form.value.code.trim() }
      const res = await createTag(payload)
      if (res.code === 0) {
        ElMessage.success('创建成功')
        dialogVisible.value = false
        fetchPage()
      }
    }
  } finally {
    saving.value = false
  }
}

const doDelete = async (row: TagVO) => {
  try {
    const res = await deleteTag(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchPage()
    }
  } catch {}
}

onMounted(fetchPage)
</script>

<style scoped>
.tags-page {
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
