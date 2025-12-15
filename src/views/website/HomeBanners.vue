<template>
  <div class="categories-container">
    <div class="header">
      <h2>Home Banner</h2>
      <el-button type="primary" @click="handleAdd">新增 Banner</el-button>
    </div>

    <el-table :data="items" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="图片" width="100">
        <template #default="{ row }">
          <ImagePreview :image="row.image" :height="50" />
        </template>
      </el-table-column>
      <el-table-column label="链接类型" width="120">
        <template #default="{ row }">
          {{ getLinkTypeLabel(row.linkType) }}
        </template>
      </el-table-column>
      <el-table-column prop="linkUrl" label="链接" min-width="200" />
      <el-table-column prop="openTarget" label="打开方式" width="120" />
      <el-table-column prop="sortOrder" label="排序" width="100" />
      <el-table-column prop="clickCount" label="点击" width="90" />
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
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增 Banner' : '编辑 Banner'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="图片" prop="imageId">
          <ImageUpload
            v-model="form.imageId"
            :preview-url="imagePreviewUrl"
            aspect-code="banner"
            :max-size-mb="4"
            @uploaded="handleImageUploaded"
          />
        </el-form-item>

        <el-form-item label="链接类型" prop="linkType">
          <el-select v-model="form.linkType" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="opt in linkTypeOptions"
              :key="opt.value"
              :label="opt.description || opt.name || opt.value"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="链接" prop="linkUrl">
          <el-input v-model="form.linkUrl" placeholder="请输入跳转链接" />
        </el-form-item>

        <el-form-item label="打开方式" prop="openTarget">
          <el-input v-model="form.openTarget" placeholder="例如: _self / _blank" />
        </el-form-item>

        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999999" :step="1" controls-position="right" />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>

        <el-form-item label="状态" prop="isActive">
          <el-switch v-model="form.isActive" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
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
import { onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import ImagePreview from '@/components/common/ImagePreview.vue'
import ImageUpload from '@/components/common/ImageUpload.vue'
import type { ImageVO } from '@/types/image'
import type { HomeBannerVO } from '@/types/home-banner'
import { activateHomeBanner, createHomeBanner, deleteHomeBanner, getHomeBannerById, pageHomeBanners, updateHomeBanner } from '@/api/home-banner'
import type { EnumOption } from '@/api/common'
import { useEnumStore, WEBSITE_BANNER_LINK_TYPE_ENUM_NAME } from '@/store/common'

const items = ref<HomeBannerVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const form = ref({
  id: 0,
  imageId: undefined as number | undefined,
  linkType: '',
  linkUrl: '',
  openTarget: '',
  sortOrder: 0,
  remark: '',
  isActive: 1
})

const imagePreviewUrl = ref('')

const enumStore = useEnumStore()
const linkTypeOptions = ref<EnumOption[]>([])

const getLinkTypeLabel = (v?: string) => {
  if (!v) return ''
  const it = linkTypeOptions.value.find((x) => (x?.value || '').toLowerCase() === v.toLowerCase())
  return it?.description || it?.name || v
}

watch(
  () => form.value.imageId,
  (v) => {
    if (v === undefined) imagePreviewUrl.value = ''
  }
)

const getImageUrl = (img?: any): string => {
  if (!img) return ''
  return img.url || img.previewUrl || img.formats?.thumbnail?.url || ''
}

const rules: FormRules = {
  imageId: [{ required: true, message: '请选择图片', trigger: 'change' }],
  linkType: [{ required: true, message: '请选择 linkType', trigger: 'change' }],
  linkUrl: [{ required: true, message: '请输入 linkUrl', trigger: 'blur' }]
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await pageHomeBanners({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      orderBy: 'sortOrder:desc'
    })
    if (res.code === 0) {
      items.value = res.data?.list || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.msg || '获取列表失败')
    }
  } catch {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    id: 0,
    imageId: undefined,
    linkType: '',
    linkUrl: '',
    openTarget: '',
    sortOrder: 0,
    remark: '',
    isActive: 1
  }
  imagePreviewUrl.value = ''
  dialogVisible.value = true
}

const handleEdit = async (row: HomeBannerVO) => {
  dialogType.value = 'edit'
  loading.value = true
  try {
    const resp = await getHomeBannerById(row.id)
    const detail = (resp as any)?.data as HomeBannerVO | undefined
    const r = detail || row
    form.value = {
      id: r.id,
      imageId: (r.imageId ?? undefined) as any,
      linkType: r.linkType || '',
      linkUrl: r.linkUrl || '',
      openTarget: (r.openTarget || '') as any,
      sortOrder: (r.sortOrder ?? 0) as any,
      remark: (r.remark || '') as any,
      isActive: r.isActive ?? 1
    }
    imagePreviewUrl.value = getImageUrl((r as any)?.image)
    dialogVisible.value = true
  } catch {
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = (row: HomeBannerVO) => {
  ElMessageBox.confirm('确定要删除该 Banner 吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteHomeBanner(row.id)
      if (res.code === 0) {
        ElMessage.success('删除成功')
        fetchList()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch {
      ElMessage.error('删除失败')
    }
  })
}

const handleImageUploaded = (img: ImageVO) => {
  imagePreviewUrl.value = (img as any)?.previewUrl || (img as any)?.formats?.thumbnail?.url || (img as any)?.url || ''
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (dialogType.value === 'add') {
        const res = await createHomeBanner({
          imageId: form.value.imageId as number,
          linkType: form.value.linkType,
          linkUrl: form.value.linkUrl,
          openTarget: form.value.openTarget,
          sortOrder: form.value.sortOrder,
          remark: form.value.remark,
          isActive: form.value.isActive
        })
        if (res.code === 0) {
          ElMessage.success('新增成功')
          dialogVisible.value = false
          fetchList()
        } else {
          ElMessage.error(res.msg || '新增失败')
        }
      } else {
        const res = await updateHomeBanner({
          id: form.value.id,
          imageId: form.value.imageId,
          linkType: form.value.linkType,
          linkUrl: form.value.linkUrl,
          openTarget: form.value.openTarget,
          sortOrder: form.value.sortOrder,
          remark: form.value.remark,
          isActive: form.value.isActive
        })
        if (res.code === 0) {
          ElMessage.success('更新成功')
          dialogVisible.value = false
          fetchList()
        } else {
          ElMessage.error(res.msg || '更新失败')
        }
      }
    } catch {
      ElMessage.error(dialogType.value === 'add' ? '新增失败' : '更新失败')
    }
  })
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchList()
}

const handleStatusChange = async (row: HomeBannerVO, val: number) => {
  try {
    const res = await activateHomeBanner(row.id, val)
    if (res.code === 0) {
      ElMessage.success('状态更新成功')
      fetchList()
    } else {
      ElMessage.error(res.msg || '状态更新失败')
    }
  } catch {
    ElMessage.error('状态更新失败')
    row.isActive = val === 1 ? 0 : 1
  }
}

onMounted(() => {
  enumStore
    .getEnumOptions(WEBSITE_BANNER_LINK_TYPE_ENUM_NAME)
    .then((opts) => {
      linkTypeOptions.value = opts
    })
    .catch(() => {
      linkTypeOptions.value = []
    })
  fetchList()
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
</style>
