<template>
  <div class="categories-container">
    <div class="header">
      <h2>应用分类</h2>
      <el-button type="primary" @click="handleAdd">新增分类</el-button>
    </div>
    <el-table :data="categories" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="分类名称" />
      <el-table-column prop="slug" label="标识" />
      <el-table-column prop="sort" label="排序" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.isActive"
            :active-value="1"
            :inactive-value="0"
            @change="(val: number) => handleStatusChange(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column label="Banner" width="100">
        <template #default="{ row }">
          <ImagePreview :image="row.banner" :height="50" />
        </template>
      </el-table-column>
      <el-table-column label="Hero" width="100">
        <template #default="{ row }">
          <ImagePreview :image="row.hero" :height="50" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增分类' : '编辑分类'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="标识" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入分类标识" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999999" :step="1" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态" prop="isActive">
          <el-switch
            v-model="form.isActive"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        <el-form-item label="Banner" prop="bannerId">
          <ImageUpload
            v-model="form.bannerId"
            :preview-url="bannerPreviewUrl"
            aspect-code="banner"
            :max-size-mb="2"
            @uploaded="handleBannerUploaded"
          />
        </el-form-item>
        <el-form-item label="Hero" prop="heroId">
          <ImageUpload
            v-model="form.heroId"
            :preview-url="heroPreviewUrl"
            aspect-code="hero"
            :max-size-mb="2"
            @uploaded="handleHeroUploaded"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createCategory, deleteCategory, fetchCategoryPage, getCategory, updateCategory, updateCategoryStatus } from '@/api/category'
import type { Category } from '@/types/category'
import ImageUpload from '@/components/common/ImageUpload.vue'
import ImagePreview from '@/components/common/ImagePreview.vue'
import type { ImageVO } from '@/types/image'

// 表格数据
const categories = ref<Category[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 表单相关
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const form = ref({
  id: 0,
  name: '',
  slug: '',
  bannerId: undefined as number | undefined,
  heroId: undefined as number | undefined,
  sort: 0,
  isActive: 1
})
const bannerPreviewUrl = ref('')
const heroPreviewUrl = ref('')

watch(
  () => form.value.bannerId,
  (v) => {
    if (v === undefined) {
      bannerPreviewUrl.value = ''
    }
  }
)

watch(
  () => form.value.heroId,
  (v) => {
    if (v === undefined) {
      heroPreviewUrl.value = ''
    }
  }
)

const getImageUrl = (img?: any): string => {
  if (!img) return ''
  return img.url || img.previewUrl || img.formats?.thumbnail?.url || ''
}

const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  slug: [
    { required: true, message: '请输入分类标识', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '只能包含小写字母、数字和连字符', trigger: 'blur' }
  ],
  sort: [
    { type: 'number', message: '排序必须为数字', trigger: 'change' }
  ]
}

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await fetchCategoryPage({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      orderBy: 'sort:desc'
    })
    if (res.code === 0) {
      categories.value = res.data?.list || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.msg || '获取分类列表失败')
    }
  } catch (error) {
    ElMessage.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

// 新增分类
const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    id: 0,
    name: '',
    slug: '',
    bannerId: undefined,
    heroId: undefined,
    sort: 0,
    isActive: 1
  }
  bannerPreviewUrl.value = ''
  heroPreviewUrl.value = ''
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = async (row: Category) => {
  dialogType.value = 'edit'
  loading.value = true
  try {
    const resp = await getCategory(row.id)
    const detail = (resp as any)?.data as Category | undefined
    const r = detail || row
    form.value = {
      id: r.id,
      name: r.name,
      slug: r.slug,
      bannerId: (r.bannerId ?? r.banner?.id) ?? undefined,
      heroId: (r.heroId ?? r.hero?.id) ?? undefined,
      sort: r.sort ?? 0,
      isActive: r.isActive
    }
    bannerPreviewUrl.value = getImageUrl(r.banner)
    heroPreviewUrl.value = getImageUrl(r.hero)
    dialogVisible.value = true
  } catch {
    ElMessage.error('获取分类详情失败')
  } finally {
    loading.value = false
  }
}

// 删除分类
const handleDelete = (row: Category) => {
  ElMessageBox.confirm(
    '确定要删除该分类吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await deleteCategory(row.id)
      if (res.code === 0) {
        ElMessage.success('删除成功')
        fetchCategories()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const handleBannerUploaded = (img: ImageVO) => {
  bannerPreviewUrl.value = (img as any)?.previewUrl || (img as any)?.formats?.thumbnail?.url || (img as any)?.url || ''
}

const handleHeroUploaded = (img: ImageVO) => {
  heroPreviewUrl.value = (img as any)?.previewUrl || (img as any)?.formats?.thumbnail?.url || (img as any)?.url || ''
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (dialogType.value === 'add') {
          const res = await createCategory({
            name: form.value.name,
            slug: form.value.slug,
            heroId: form.value.heroId,
            bannerId: form.value.bannerId
          })
          if (res.code === 0) {
            ElMessage.success('新增成功')
            dialogVisible.value = false
            fetchCategories()
          } else {
            ElMessage.error(res.msg || '新增失败')
          }
        } else {
          const res = await updateCategory(form.value.id, {
            name: form.value.name,
            slug: form.value.slug,
            heroId: form.value.heroId,
            bannerId: form.value.bannerId,
            sort: form.value.sort,
            isActive: form.value.isActive
          })
          if (res.code === 0) {
            ElMessage.success('更新成功')
            dialogVisible.value = false
            fetchCategories()
          } else {
            ElMessage.error(res.msg || '更新失败')
          }
        }
      } catch (error) {
        ElMessage.error(dialogType.value === 'add' ? '新增失败' : '更新失败')
      }
    }
  })
}

// 分页相关
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchCategories()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchCategories()
}

// 切换分类状态
const handleStatusChange = async (row: Category, val: number) => {
  try {
    const res = await updateCategoryStatus(row.id, val)
    if (res.code === 0) {
      ElMessage.success('状态更新成功')
      fetchCategories()
    } else {
      ElMessage.error(res.msg || '状态更新失败')
    }
  } catch (error) {
    ElMessage.error('状态更新失败')
    // 回滚UI
    row.isActive = val === 1 ? 0 : 1
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.categories-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.avatar-uploader {
  :deep(.el-upload) {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}
</style> 