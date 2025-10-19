<template>
  <div class="user-profiles-page">
    <div class="page-header">
      <h2>用户画像</h2>
      <el-button type="success" @click="openCreate">新增画像</el-button>
    </div>

    <div class="filters">
      <el-input v-model.number="query.userId" placeholder="按用户ID搜索" clearable style="width: 160px; margin-right: 12px;" />
      <el-input v-model="query.name" placeholder="按名称搜索" clearable style="width: 200px; margin-right: 12px;" />
      <el-input v-model="query.country" placeholder="按国家搜索" clearable style="width: 200px; margin-right: 12px;" />
      <el-input v-model="query.city" placeholder="按城市搜索" clearable style="width: 200px; margin-right: 12px;" />
      <el-select v-model="query.status" clearable placeholder="状态" style="width: 140px; margin-right: 12px;">
        <el-option :value="1" label="启用" />
        <el-option :value="0" label="禁用" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="list" style="width: 100%" :loading="loading" :default-sort="defaultSort" @sort-change="handleSortChange">
      <el-table-column prop="id" label="ID" width="80" sortable="custom" />
      <el-table-column prop="userId" label="用户ID" width="100" sortable="custom" />
      <el-table-column prop="name" label="姓名" min-width="140" sortable="custom" />
      <el-table-column prop="gender" label="性别" width="100" />
      <el-table-column prop="age" label="年龄" width="100" sortable="custom" />
      <el-table-column prop="country" label="国家" min-width="120" sortable="custom" />
      <el-table-column prop="city" label="城市" min-width="120" sortable="custom" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="180" sortable="custom">
        <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="scope">
          <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
          <el-popconfirm title="确定删除该画像吗？" @confirm="doDelete(scope.row)">
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑画像' : '新增画像'" width="820">
      <el-form :model="form" label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model.number="form.userId" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="form.gender" style="width: 160px;">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="年龄">
          <el-input v-model.number="form.age" />
        </el-form-item>
        <el-form-item label="国家">
          <el-input v-model="form.country" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="form.city" />
        </el-form-item>
        <el-form-item label="兴趣">
          <el-input v-model="form.interests" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tags" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="扩展JSON">
          <el-input v-model="form.extJson" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 160px;">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
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
import { pageUserProfiles, createUserProfile, updateUserProfile, deleteUserProfile, type UserProfileVO, type UserProfileCreateDTO, type UserProfileUpdateDTO } from '@/api/user-profile'
import { formatDateTime } from '@/utils/date'

const loading = ref(false)
const saving = ref(false)
const list = ref<UserProfileVO[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref<number | null>(null)

const defaultSort = ref<{ prop: string; order: 'ascending' | 'descending' }>({ prop: 'id', order: 'descending' })

const query = ref({
  pageNum: 1,
  pageSize: 10,
  userId: undefined as number | undefined,
  name: undefined as string | undefined,
  country: undefined as string | undefined,
  city: undefined as string | undefined,
  status: undefined as number | undefined,
  orderBy: 'id desc' as string | undefined,
})

const form = ref<UserProfileCreateDTO>({
  userId: undefined,
  name: '',
  gender: undefined,
  age: undefined,
  country: '',
  city: '',
  interests: '',
  tags: '',
  extJson: '',
  status: 1,
})

const fetchPage = async () => {
  loading.value = true
  try {
    const res = await pageUserProfiles(query.value)
    if (res.code === 0 && res.data) {
      list.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取用户画像失败')
    }
  } catch (e) {
    ElMessage.error('获取用户画像失败')
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
  query.value = { pageNum: 1, pageSize: size, userId: undefined, name: undefined, country: undefined, city: undefined, status: undefined, orderBy: 'id desc' }
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
  form.value = { userId: undefined, name: '', gender: undefined, age: undefined, country: '', city: '', interests: '', tags: '', extJson: '', status: 1 }
  dialogVisible.value = true
}

const openEdit = (row: UserProfileVO) => {
  isEdit.value = true
  currentId.value = row.id
  form.value = {
    userId: row.userId,
    name: row.name,
    gender: row.gender as any,
    age: row.age as any,
    country: row.country,
    city: row.city,
    interests: row.interests,
    tags: row.tags,
    extJson: row.extJson,
    status: row.status,
  }
  dialogVisible.value = true
}

const handleSave = async () => {
  saving.value = true
  try {
    if (isEdit.value && currentId.value) {
      const payload: UserProfileUpdateDTO = { ...form.value }
      const res = await updateUserProfile(currentId.value, payload)
      if (res.code === 0) {
        ElMessage.success('更新成功')
        dialogVisible.value = false
        fetchPage()
      }
    } else {
      const payload: UserProfileCreateDTO = { ...form.value }
      const res = await createUserProfile(payload)
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

const doDelete = async (row: UserProfileVO) => {
  try {
    const res = await deleteUserProfile(row.id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchPage()
    }
  } catch {}
}

onMounted(fetchPage)
</script>

<style scoped>
.user-profiles-page {
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
