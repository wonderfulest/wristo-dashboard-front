<template>
  <div class="categories-container">
    <div class="header">
      <div>
        <p>官网只展示主系列；所有基础分类、细分分类、功能、场景和设备维度统一维护为标签。</p>
      </div>
      <div class="header-actions">
        <el-button v-if="activeTab !== 'tags'" type="primary" @click="handleAddCategory">
          新增主系列
        </el-button>
        <el-button v-else type="primary" @click="handleAddTag">新增标签</el-button>
      </div>
    </div>

    <el-alert
      type="info"
      show-icon
      :closable="false"
      class="system-note"
      title="分类重构规则"
      description="Categories 下拉和首页系列只使用主系列；Venu/Fenix/Forerunner 等设备维度、Animal/Fantasy/Flower 等细项都统一进入标签体系。"
    />

    <el-tabs v-model="activeTab" class="category-tabs">
      <el-tab-pane label="官网主系列" name="public">
        <el-table :data="publicCategories" style="width: 100%" v-loading="categoryLoading">
          <el-table-column prop="name" label="主系列" min-width="180">
            <template #default="{ row }">
              <div class="name-cell">
                <strong>{{ publicSeriesName(row) }}</strong>
                <span>/categories/{{ row.slug }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="100" />
          <el-table-column label="应用数" width="110">
            <template #default="{ row }">{{ row.appCount ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="公开展示" width="120">
            <template #default="{ row }">
              <el-switch
                v-model="row.isActive"
                :active-value="1"
                :inactive-value="0"
                @change="(val: number) => handleCategoryStatusChange(row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column label="Hero" width="100">
            <template #default="{ row }">
              <ImagePreview :image="row.hero" :height="50" />
            </template>
          </el-table-column>
          <el-table-column label="说明" min-width="220">
            <template #default="{ row }">
              <span class="row-note">{{ publicSeriesNote(row.slug) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleEditCategory(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="标签" name="tags">
        <div class="tag-toolbar">
          <el-input v-model.trim="tagQuery.keyword" clearable placeholder="搜索标签名称或 slug" style="width: 240px" @keyup.enter="fetchTags" />
          <el-select v-model="tagQuery.tagGroup" clearable placeholder="标签组" style="width: 160px" @change="fetchTags">
            <el-option v-for="group in tagGroups" :key="group.value" :label="group.label" :value="group.value" />
          </el-select>
          <el-select v-model="tagQuery.status" clearable placeholder="状态" style="width: 120px" @change="fetchTags">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
          <el-button @click="fetchTags">刷新</el-button>
        </div>

        <el-table :data="tags" style="width: 100%" v-loading="tagLoading">
          <el-table-column prop="name" label="标签" min-width="180">
            <template #default="{ row }">
              <div class="name-cell">
                <strong>{{ row.name }}</strong>
                <span>{{ row.slug }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="标签组" width="130">
            <template #default="{ row }">
              <el-tag :type="tagGroupType(row.tagGroup)">{{ tagGroupLabel(row.tagGroup) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="90" />
          <el-table-column label="应用数" width="110">
            <template #default="{ row }">{{ row.appCount ?? 0 }}</template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="240" show-overflow-tooltip />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                :active-value="1"
                :inactive-value="0"
                @change="(val: number) => handleTagStatusChange(row, val)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleEditTag(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="tagPage"
            v-model:page-size="tagPageSize"
            :total="tagTotal"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleTagSizeChange"
            @current-change="handleTagCurrentChange"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="categoryDialogVisible" :title="categoryDialogType === 'add' ? '新增主系列' : '编辑分类'" width="520px">
      <el-form ref="categoryFormRef" :model="categoryForm" :rules="categoryRules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="All Watch Faces" />
        </el-form-item>
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="categoryForm.slug" placeholder="whole" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="categoryForm.sort" :min="0" :max="999999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="categoryForm.isActive" :active-value="1" :inactive-value="0" active-text="展示" inactive-text="隐藏" />
        </el-form-item>
        <el-form-item label="Banner">
          <ImageUpload
            v-model="categoryForm.bannerId"
            :preview-url="bannerPreviewUrl"
            aspect-code="banner"
            :max-size-mb="2"
            @uploaded="handleBannerUploaded"
          />
        </el-form-item>
        <el-form-item label="Hero">
          <ImageUpload
            v-model="categoryForm.heroId"
            :preview-url="heroPreviewUrl"
            aspect-code="hero"
            :max-size-mb="2"
            @uploaded="handleHeroUploaded"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitCategory">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tagDialogVisible" :title="tagDialogType === 'add' ? '新增标签' : '编辑标签'" width="520px">
      <el-form ref="tagFormRef" :model="tagForm" :rules="tagRules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="tagForm.name" placeholder="AMOLED" />
        </el-form-item>
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="tagForm.slug" placeholder="amoled" />
        </el-form-item>
        <el-form-item label="标签组" prop="tagGroup">
          <el-select v-model="tagForm.tagGroup" style="width: 100%">
            <el-option v-for="group in tagGroups" :key="group.value" :label="group.label" :value="group.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="tagForm.sort" :min="0" :max="999999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="tagForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="tagForm.description" type="textarea" :rows="3" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitTag">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  createCategory,
  createProductTag,
  fetchCategoryPage,
  fetchProductTagPage,
  getCategory,
  updateCategory,
  updateCategoryStatus,
  updateProductTag,
  updateProductTagStatus,
} from '@/api/category'
import type { Category, ProductTag } from '@/types/category'
import ImageUpload from '@/components/common/ImageUpload.vue'
import ImagePreview from '@/components/common/ImagePreview.vue'
import type { ImageVO } from '@/types/image'

type TabName = 'public' | 'tags'

const publicSeries = [
  { slug: 'whole', name: 'All Watch Faces', sort: 1000, note: '官网总入口，不作为风格标签。' },
  { slug: 'digital', name: 'Digital Utility', sort: 990, note: 'Digital、Data-rich、Weather 聚合。' },
  { slug: 'minimal', name: 'Minimal & Simple', sort: 980, note: 'Simple、Daily、Strokes 聚合。' },
  { slug: 'analog', name: 'Analog Classic', sort: 970, note: 'Analog 风格；Fenix/Venu 不进主系列。' },
  { slug: 'neon', name: 'Neon & Cyberpunk', sort: 960, note: 'Neon、Cyberpunk、Halo 聚合。' },
  { slug: 'nature', name: 'Nature & Landscape', sort: 950, note: 'Landscape、Mountain、Nature 聚合。' },
  { slug: 'cartoon', name: 'Animals & Cartoon', sort: 940, note: 'Animal、Cartoon、Family、Fun 聚合。' },
  { slug: 'flower', name: 'Floral & Mandala', sort: 930, note: 'Flower、Mandala、Dots 聚合。' },
  { slug: 'galaxy', name: 'Galaxy & Fantasy', sort: 920, note: 'Galaxy、Fantasy 聚合。' },
  { slug: 'pop-retro', name: 'Pop & Retro', sort: 910, note: 'Pop Pulse、Retro、Skull 聚合。' },
  { slug: 'seasonal', name: 'Seasonal', sort: 900, note: '节日或活动期展示。' },
]

const tagGroups = [
  { value: 'style', label: '风格' },
  { value: 'function', label: '功能' },
  { value: 'scene', label: '场景' },
  { value: 'seasonal', label: '节日' },
  { value: 'device', label: '设备' },
  { value: 'meta', label: '运营' },
]

const activeTab = ref<TabName>('public')
const allCategories = ref<Category[]>([])
const categoryLoading = ref(false)
const categoryDialogVisible = ref(false)
const categoryDialogType = ref<'add' | 'edit'>('add')
const categoryFormRef = ref<FormInstance>()
const categoryForm = ref({
  id: 0,
  name: '',
  slug: '',
  bannerId: undefined as number | undefined,
  heroId: undefined as number | undefined,
  sort: 0,
  isActive: 1,
})
const bannerPreviewUrl = ref('')
const heroPreviewUrl = ref('')

const tags = ref<ProductTag[]>([])
const tagLoading = ref(false)
const tagPage = ref(1)
const tagPageSize = ref(50)
const tagTotal = ref(0)
const tagQuery = ref<{ keyword: string; tagGroup: string; status: number | undefined }>({
  keyword: '',
  tagGroup: '',
  status: undefined,
})
const tagDialogVisible = ref(false)
const tagDialogType = ref<'add' | 'edit'>('add')
const tagFormRef = ref<FormInstance>()
const tagForm = ref({
  id: 0,
  name: '',
  slug: '',
  tagGroup: 'style',
  sort: 0,
  status: 1,
  description: '',
})

const publicCategories = computed(() => {
  return publicSeries
    .map((definition) => {
      const category = allCategories.value.find((item) => item.slug === definition.slug)
      return category ? { ...category, name: definition.name, sort: category.sort ?? definition.sort } : null
    })
    .filter(Boolean) as Category[]
})

const categoryRules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  slug: [
    { required: true, message: '请输入分类标识', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '只能包含小写字母、数字和连字符', trigger: 'blur' },
  ],
}

const tagRules: FormRules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  slug: [
    { required: true, message: '请输入标签标识', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '只能包含小写字母、数字和连字符', trigger: 'blur' },
  ],
  tagGroup: [{ required: true, message: '请选择标签组', trigger: 'change' }],
}

watch(() => categoryForm.value.bannerId, (value) => {
  if (value === undefined) bannerPreviewUrl.value = ''
})

watch(() => categoryForm.value.heroId, (value) => {
  if (value === undefined) heroPreviewUrl.value = ''
})

const getImageUrl = (img?: any): string => {
  if (!img) return ''
  return img.url || img.previewUrl || img.formats?.thumbnail?.url || ''
}

const fetchCategories = async () => {
  categoryLoading.value = true
  try {
    const res = await fetchCategoryPage({
      pageNum: 1,
      pageSize: 1000,
      orderBy: 'sort:desc',
    })
    allCategories.value = res.data?.list || []
  } catch {
    ElMessage.error('获取分类列表失败')
  } finally {
    categoryLoading.value = false
  }
}

const fetchTags = async () => {
  tagLoading.value = true
  try {
    const res = await fetchProductTagPage({
      pageNum: tagPage.value,
      pageSize: tagPageSize.value,
      orderBy: 'sort:desc',
      keyword: tagQuery.value.keyword || undefined,
      tagGroup: tagQuery.value.tagGroup || undefined,
      status: tagQuery.value.status,
    })
    tags.value = res.data?.list || []
    tagTotal.value = res.data?.total || 0
  } catch {
    ElMessage.error('获取标签列表失败')
  } finally {
    tagLoading.value = false
  }
}

const publicSeriesName = (category: Category) => {
  return publicSeries.find((item) => item.slug === category.slug)?.name || category.name
}

const publicSeriesNote = (slug: string) => {
  return publicSeries.find((item) => item.slug === slug)?.note || ''
}

const tagGroupLabel = (group: string) => tagGroups.find((item) => item.value === group)?.label || group
const tagGroupType = (group: string) => {
  if (group === 'style') return 'success'
  if (group === 'function') return 'warning'
  if (group === 'scene') return 'primary'
  if (group === 'device') return 'info'
  if (group === 'seasonal') return 'danger'
  return ''
}

const handleAddCategory = () => {
  categoryDialogType.value = 'add'
  categoryForm.value = { id: 0, name: '', slug: '', bannerId: undefined, heroId: undefined, sort: 0, isActive: 1 }
  bannerPreviewUrl.value = ''
  heroPreviewUrl.value = ''
  categoryDialogVisible.value = true
}

const handleEditCategory = async (row: Category) => {
  categoryDialogType.value = 'edit'
  categoryLoading.value = true
  try {
    const resp = await getCategory(row.id)
    const r = resp.data || row
    categoryForm.value = {
      id: r.id,
      name: r.name,
      slug: r.slug,
      bannerId: (r.bannerId ?? r.banner?.id) ?? undefined,
      heroId: (r.heroId ?? r.hero?.id) ?? undefined,
      sort: r.sort ?? 0,
      isActive: r.isActive,
    }
    bannerPreviewUrl.value = getImageUrl(r.banner)
    heroPreviewUrl.value = getImageUrl(r.hero)
    categoryDialogVisible.value = true
  } catch {
    ElMessage.error('获取分类详情失败')
  } finally {
    categoryLoading.value = false
  }
}

const handleBannerUploaded = (img: ImageVO) => {
  bannerPreviewUrl.value = (img as any)?.previewUrl || (img as any)?.formats?.thumbnail?.url || (img as any)?.url || ''
}

const handleHeroUploaded = (img: ImageVO) => {
  heroPreviewUrl.value = (img as any)?.previewUrl || (img as any)?.formats?.thumbnail?.url || (img as any)?.url || ''
}

const handleSubmitCategory = async () => {
  if (!categoryFormRef.value) return
  await categoryFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      if (categoryDialogType.value === 'add') {
        const created = await createCategory({
          name: categoryForm.value.name,
          slug: categoryForm.value.slug,
          heroId: categoryForm.value.heroId,
          bannerId: categoryForm.value.bannerId,
        })
        if (created.data?.id) {
          await updateCategory(created.data.id, {
            sort: categoryForm.value.sort,
            isActive: categoryForm.value.isActive,
          })
        }
        ElMessage.success('新增成功')
      } else {
        await updateCategory(categoryForm.value.id, {
          name: categoryForm.value.name,
          slug: categoryForm.value.slug,
          heroId: categoryForm.value.heroId,
          bannerId: categoryForm.value.bannerId,
          sort: categoryForm.value.sort,
          isActive: categoryForm.value.isActive,
        })
        ElMessage.success('更新成功')
      }
      categoryDialogVisible.value = false
      fetchCategories()
    } catch {
      ElMessage.error(categoryDialogType.value === 'add' ? '新增失败' : '更新失败')
    }
  })
}

const handleCategoryStatusChange = async (row: Category, val: number) => {
  try {
    await updateCategoryStatus(row.id, val)
    ElMessage.success('状态更新成功')
    fetchCategories()
  } catch {
    ElMessage.error('状态更新失败')
    row.isActive = val === 1 ? 0 : 1
  }
}

const handleAddTag = () => {
  tagDialogType.value = 'add'
  tagForm.value = { id: 0, name: '', slug: '', tagGroup: 'style', sort: 0, status: 1, description: '' }
  tagDialogVisible.value = true
}

const handleEditTag = (row: ProductTag) => {
  tagDialogType.value = 'edit'
  tagForm.value = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagGroup: row.tagGroup,
    sort: row.sort ?? 0,
    status: row.status ?? 1,
    description: row.description || '',
  }
  tagDialogVisible.value = true
}

const handleSubmitTag = async () => {
  if (!tagFormRef.value) return
  await tagFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const payload = {
        name: tagForm.value.name,
        slug: tagForm.value.slug,
        tagGroup: tagForm.value.tagGroup,
        sort: tagForm.value.sort,
        status: tagForm.value.status,
        description: tagForm.value.description,
      }
      if (tagDialogType.value === 'add') {
        await createProductTag(payload)
        ElMessage.success('标签已新增')
      } else {
        await updateProductTag(tagForm.value.id, payload)
        ElMessage.success('标签已更新')
      }
      tagDialogVisible.value = false
      fetchTags()
    } catch {
      ElMessage.error(tagDialogType.value === 'add' ? '新增标签失败' : '更新标签失败')
    }
  })
}

const handleTagStatusChange = async (row: ProductTag, val: number) => {
  try {
    await updateProductTagStatus(row.id, val)
    ElMessage.success('标签状态已更新')
    fetchTags()
  } catch {
    ElMessage.error('标签状态更新失败')
    row.status = val === 1 ? 0 : 1
  }
}

const handleTagSizeChange = (val: number) => {
  tagPageSize.value = val
  tagPage.value = 1
  fetchTags()
}

const handleTagCurrentChange = (val: number) => {
  tagPage.value = val
  fetchTags()
}

onMounted(() => {
  fetchCategories()
  fetchTags()
})
</script>

<style scoped>
.categories-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 18px;
}

.header h2 {
  margin: 0 0 6px;
}

.header p {
  margin: 0;
  color: #667085;
  font-size: 14px;
}

.header-actions {
  flex-shrink: 0;
}

.system-note {
  margin-bottom: 16px;
}

.category-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.name-cell {
  display: grid;
  gap: 4px;
}

.name-cell strong {
  color: #101828;
}

.name-cell span,
.row-note {
  color: #667085;
  font-size: 12px;
}

.tag-toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
