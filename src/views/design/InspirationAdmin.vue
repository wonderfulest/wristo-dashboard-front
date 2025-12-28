<template>
  <div class="inspiration-container">
    <div class="header">
      <h2>设计灵感</h2>
      <div class="tools">
        <el-input
          v-model="keyword"
          placeholder="关键词"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleSearch"
        />
        <el-input-number
          v-model="userId"
          :min="1"
          placeholder="UserId"
          controls-position="right"
          @change="handleSearch"
        />
        <el-input-number
          v-model="rating"
          :min="1"
          :max="5"
          placeholder="评分"
          controls-position="right"
          @change="handleSearch"
        />
        <el-select v-model="isActive" placeholder="是否启用" clearable style="width: 140px" @change="handleSearch">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="success" @click="openCreate">新增</el-button>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="fetchPage">刷新</el-button>
      </div>
    </div>

    <el-table :data="rows" v-loading="loading" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="预览" width="140">
        <template #default="{ row }">
          <ImagePreview :image="row.previewImage" :height="80" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="220" />
      <el-table-column prop="rating" label="评分" width="100" />
      <el-table-column label="启用" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="所属用户" min-width="160">
        <template #default="{ row }">
          <div class="author-cell">
            <el-avatar v-if="row.author?.avatar" :src="row.author.avatar" :size="24" />
            <div class="author-text">
              <div class="author-name">{{ row.author?.nickname || row.author?.username || '-' }}</div>
              <div class="author-id">ID: {{ row.userId || '-' }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="180" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.assetZip?.url" size="small" text type="primary" @click="downloadAsset(row)">下载</el-button>
          <el-button size="small" text type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" text type="danger" @click="confirmRemove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="createVisible" title="新增设计灵感" width="720px">
      <el-form ref="createFormRef" :model="createForm" :rules="rules" label-width="120px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="createForm.title" />
        </el-form-item>
        <el-form-item label="预览图" prop="previewImageId">
          <ImageUpload v-model="createForm.previewImageId" aspect-code="hero" />
        </el-form-item>
        <el-form-item label="素材ZIP" prop="assetZipId">
          <FileUpload v-model="createForm.assetZipId" usage-type="inspiration" accept=".zip" />
        </el-form-item>
        <el-form-item label="来源页URL">
          <el-input v-model="createForm.sourcePageUrl" />
        </el-form-item>
        <el-form-item label="评分">
          <el-input-number v-model="createForm.rating" :min="1" :max="5" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="设计师备注">
          <el-input v-model="createForm.designerNote" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="启用" prop="isActive">
          <el-switch v-model="createForm.isActive" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="编辑设计灵感" width="720px">
      <el-form ref="editFormRef" :model="editForm" :rules="rules" label-width="120px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="预览图" prop="previewImageId">
          <ImageUpload v-model="editForm.previewImageId" :preview-url="editPreviewUrl" aspect-code="inspiration" />
        </el-form-item>
        <el-form-item label="素材ZIP" prop="assetZipId">
          <FileUpload v-model="editForm.assetZipId" usage-type="inspiration" accept=".zip" />
        </el-form-item>
        <el-form-item label="来源页URL">
          <el-input v-model="editForm.sourcePageUrl" />
        </el-form-item>
        <el-form-item label="评分">
          <el-input-number v-model="editForm.rating" :min="1" :max="5" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="设计师备注">
          <el-input v-model="editForm.designerNote" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="启用" prop="isActive">
          <el-switch v-model="editForm.isActive" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { InspirationVO, InspirationCreateDTO, InspirationUpdateDTO } from '@/types/inspiration'
import { pageInspirations, createInspiration, updateInspiration, removeInspiration, getInspiration } from '@/api/inspiration'
import ImageUpload from '@/components/common/ImageUpload.vue'
import FileUpload from '@/components/common/FileUpload.vue'
import ImagePreview from '@/components/common/ImagePreview.vue'

const rows = ref<InspirationVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const keyword = ref<string | undefined>(undefined)
const userId = ref<number | undefined>(undefined)
const rating = ref<number | undefined>(undefined)
const isActive = ref<number | undefined>(undefined)

const createVisible = ref(false)
const editVisible = ref(false)

const editPreviewUrl = ref<string>('')

const createFormRef = ref()
const editFormRef = ref()

const createForm = ref<InspirationCreateDTO>({
  title: '',
  previewImageId: 0 as any,
  assetZipId: undefined,
  sourcePageUrl: undefined,
  rating: undefined,
  designerNote: undefined,
  isActive: 1
})

const editForm = ref<InspirationUpdateDTO>({
  id: 0,
  title: '',
  previewImageId: 0,
  assetZipId: undefined,
  sourcePageUrl: undefined,
  rating: undefined,
  designerNote: undefined,
  isActive: 1
})

const rules = {
  title: [{ required: true, message: '请填写标题', trigger: 'blur' }],
  previewImageId: [{ required: true, message: '请填写预览图ID', trigger: 'change' }],
  isActive: [{ required: true, message: '请选择是否启用', trigger: 'change' }]
}

const submitting = ref(false)

const fetchPage = async () => {
  loading.value = true
  try {
    const resp = (await pageInspirations({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      userId: userId.value,
      rating: rating.value,
      isActive: isActive.value,
      orderBy: 'id:desc'
    } as any)) as unknown as ApiResponse<PageResponse<InspirationVO>>

    rows.value = resp.data?.list || []
    total.value = resp.data?.total || 0
  } catch (e) {
    ElMessage.error('获取设计灵感列表失败')
  } finally {
    loading.value = false
  }
}

const downloadAsset = (row: InspirationVO) => {
  const url = row.assetZip?.url
  if (!url) {
    ElMessage.warning('暂无素材可下载')
    return
  }
  window.open(url, '_blank')
}

const handleSearch = () => {
  currentPage.value = 1
  fetchPage()
}
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchPage()
}
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchPage()
}

const openCreate = () => {
  createVisible.value = true
}

watch(
  () => createVisible.value,
  (v) => {
    if (v) {
      createForm.value = {
        title: '',
        previewImageId: 0 as any,
        assetZipId: undefined,
        sourcePageUrl: undefined,
        rating: undefined,
        designerNote: undefined,
        isActive: 1
      }
    }
  }
)

const submitCreate = async () => {
  const formEl = createFormRef.value as any
  if (formEl) {
    const valid = await formEl.validate().catch(() => false)
    if (!valid) return
  }

  submitting.value = true
  try {
    await createInspiration(createForm.value)
    ElMessage.success('新增成功')
    createVisible.value = false
    fetchPage()
  } catch (e) {
    ElMessage.error('新增失败')
  } finally {
    submitting.value = false
  }
}

const openEdit = async (row: InspirationVO) => {
  editVisible.value = true
  editPreviewUrl.value = row.previewImage?.previewUrl || row.previewImage?.url || ''
  editForm.value = {
    id: row.id,
    title: row.title,
    previewImageId: row.previewImageId,
    assetZipId: row.assetZipId || undefined,
    sourcePageUrl: row.sourcePageUrl,
    rating: row.rating,
    designerNote: row.designerNote,
    isActive: row.isActive
  }

  try {
    const resp = (await getInspiration(row.id)) as unknown as ApiResponse<InspirationVO>
    if (resp.code === 0 && resp.data) {
      editPreviewUrl.value = resp.data.previewImage?.previewUrl || resp.data.previewImage?.url || editPreviewUrl.value
      editForm.value = {
        id: resp.data.id,
        title: resp.data.title,
        previewImageId: resp.data.previewImageId,
        assetZipId: resp.data.assetZipId || undefined,
        sourcePageUrl: resp.data.sourcePageUrl,
        rating: resp.data.rating,
        designerNote: resp.data.designerNote,
        isActive: resp.data.isActive
      }
    }
  } catch {
    // ignore, keep list data
  }
}

const submitEdit = async () => {
  const formEl = editFormRef.value as any
  if (formEl) {
    const valid = await formEl.validate().catch(() => false)
    if (!valid) return
  }

  submitting.value = true
  try {
    await updateInspiration(editForm.value.id, {
      title: editForm.value.title,
      previewImageId: editForm.value.previewImageId,
      assetZipId: editForm.value.assetZipId,
      sourcePageUrl: editForm.value.sourcePageUrl,
      rating: editForm.value.rating,
      designerNote: editForm.value.designerNote,
      isActive: editForm.value.isActive
    } as any)
    ElMessage.success('保存成功')
    editVisible.value = false
    fetchPage()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

const confirmRemove = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认删除该设计灵感？', '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  try {
    await removeInspiration(id)
    ElMessage.success('删除成功')
    fetchPage()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchPage()
})
</script>

<style scoped>
.inspiration-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.tools { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.author-cell { display: flex; align-items: center; gap: 8px; }
.author-text { display: flex; flex-direction: column; line-height: 1.1; }
.author-name { font-size: 12px; color: #303133; }
.author-id { font-size: 12px; color: #909399; }
</style>
