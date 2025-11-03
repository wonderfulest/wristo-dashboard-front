<template>
  <div class="page">
    <div class="page-header">
      <div class="title">标签管理</div>
      <div class="actions">
        <el-button type="primary" @click="openCreate">新建标签</el-button>
      </div>
    </div>

    <div class="filters">
      <el-input 
        v-model.trim="keyword" 
        placeholder="关键词 (slug)" 
        @keyup.enter="search(1)"
        style="width: 220px"
      />
      <el-select v-model="isActive" placeholder="状态" style="width: 120px">
        <el-option label="状态" :value="undefined" />
        <el-option label="启用" :value="1" />
        <el-option label="停用" :value="0" />
      </el-select>
      <el-button @click="search(1)" :loading="loading" type="primary">搜索</el-button>
      <el-button @click="reset" :disabled="loading">重置</el-button>
    </div>

    <el-alert v-if="error" :title="error" type="error" show-icon />

    <LanguageSwitcher v-model="currentLang" @change="search(1)" @languages-loaded="onLanguagesLoaded" />

    <div class="card">
      <el-table :data="pageData.list" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="slug" label="Slug" />
        <el-table-column label="翻译" width="300">
          <template #default="{ row }">
            <div v-if="row.translations && row.translations.length > 0" class="translations">
              <el-tag 
                v-for="translation in row.translations" 
                :key="translation.lang"
                size="small"
                class="translation-tag"
              >
                {{ translation.lang }}: {{ translation.name }}
              </el-tag>
            </div>
            <span v-else class="no-translations">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <span :class="['tag', row.isActive === 1 ? 'success' : '']">{{ row.isActive === 1 ? '启用' : '停用' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="200">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="200">
          <template #default="{ row }">{{ fmtDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" @click="openTranslations(row)">翻译</el-button>
            <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty">暂无数据</div>
        </template>
      </el-table>

      <div class="pagination" v-if="pageData.pages > 1">
        <el-pagination
          v-model:current-page="pageData.pageNum"
          :page-size="pageData.pageSize"
          :total="pageData.total"
          :disabled="loading"
          layout="prev, pager, next, total"
          @current-change="changePage"
        />
      </div>
    </div>

    <!-- Tag Dialog -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogMode === 'create' ? '新建标签' : '编辑标签'"
      width="520px"
      @close="closeDialog"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="Slug">
          <el-input v-model.trim="form.slug" placeholder="slug" />
        </el-form-item>
        <el-form-item label="状态" v-if="dialogMode === 'edit'">
          <el-select v-model="form.isActive" style="width: 100%">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="dialogError">
          <el-alert :title="dialogError" type="error" show-icon :closable="false" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitDialog">
          {{ submitting ? '提交中...' : '确认' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Translation Dialog -->
    <el-dialog 
      v-model="translationDialogVisible" 
      title="标签翻译管理"
      width="800px"
      @close="closeTranslationDialog"
    >
      <div v-if="currentTag" class="translation-content">
        <div class="tag-info">
          <h4>标签: {{ currentTag.slug }} (ID: {{ currentTag.id }})</h4>
        </div>
        
        <div class="translation-form">
          <el-form :model="translationForm" label-width="80px" inline>
            <el-form-item label="语言">
              <el-select v-model="translationForm.lang" placeholder="选择语言" style="width: 150px" filterable>
                <el-option 
                  v-for="lang in availableLanguages" 
                  :key="lang" 
                  :label="lang" 
                  :value="lang"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="名称">
              <el-input v-model.trim="translationForm.name" placeholder="标签名称" style="width: 200px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addTranslation" :loading="translationSubmitting">
                添加翻译
              </el-button>
            </el-form-item>
          </el-form>
          
          <el-alert v-if="translationError" :title="translationError" type="error" show-icon />
        </div>

        <div class="translation-list">
          <h5>现有翻译</h5>
          <el-table :data="translations" border>
            <el-table-column prop="lang" label="语言" width="120" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="editTranslation(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="removeTranslation(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <div class="empty">暂无翻译</div>
            </template>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- Edit Translation Dialog -->
    <el-dialog 
      v-model="editTranslationDialogVisible" 
      title="编辑翻译"
      width="500px"
      @close="closeEditTranslationDialog"
    >
      <el-form :model="editTranslationForm" label-width="80px">
        <el-form-item label="语言">
          <el-input v-model="editTranslationForm.lang" disabled />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model.trim="editTranslationForm.name" placeholder="标签名称" />
        </el-form-item>
        <el-form-item v-if="editTranslationError">
          <el-alert :title="editTranslationError" type="error" show-icon :closable="false" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeEditTranslationDialog">取消</el-button>
        <el-button type="primary" :loading="editTranslationSubmitting" @click="submitEditTranslation">
          {{ editTranslationSubmitting ? '提交中...' : '确认' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PageResponse } from '@/types/api'
import type { BlogTagVO, BlogTagPageQueryDTO, BlogTagCreateDTO, BlogTagUpdateDTO, BlogTagTranslationVO, BlogTagTranslationDTO } from '@/types/blog'
import { 
  fetchTagPage, 
  createTag, 
  updateTag, 
  deleteTag,
  fetchTagTranslations,
  createTagTranslation,
  updateTagTranslation,
  deleteTagTranslation
} from '@/api/blog'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const loading = ref(true)
const error = ref<string | null>(null)
const pageData = ref<PageResponse<BlogTagVO>>({ pageNum: 1, pageSize: 10, total: 0, pages: 0, list: [] })

const keyword = ref('')
const isActive = ref<number | undefined>(undefined)

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const form = ref<{ id?: number; slug: string; isActive?: number }>({ slug: '' })
const dialogError = ref<string | null>(null)
const submitting = ref(false)

// Translation management
const translationDialogVisible = ref(false)
const currentTag = ref<BlogTagVO | null>(null)
const translations = ref<BlogTagTranslationVO[]>([])
const translationForm = ref<BlogTagTranslationDTO>({ lang: '', name: '' })
const translationError = ref<string | null>(null)
const translationSubmitting = ref(false)

// Edit translation
const editTranslationDialogVisible = ref(false)
const editTranslationForm = ref<BlogTagTranslationDTO>({ lang: '', name: '' })
const editTranslationError = ref<string | null>(null)
const editTranslationSubmitting = ref(false)

// Language management
const currentLang = ref<string>('')
const availableLanguages = ref<string[]>([])

const onLanguagesLoaded = (languages: string[]) => {
  availableLanguages.value = languages
}

const fmtDate = (v?: string | null) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN')
}

const search = async (pageNum = 1) => {
  try {
    loading.value = true
    error.value = null
    const dto: BlogTagPageQueryDTO = {
      pageNum,
      pageSize: pageData.value.pageSize,
      keyword: keyword.value || null,
      isActive: typeof isActive.value === 'number' ? isActive.value : null
    }
    const res = await fetchTagPage(dto, currentLang.value || undefined)
    if (res.code === 0 && res.data) pageData.value = res.data
    else error.value = res.msg || '加载失败'
  } catch (e) {
    console.error(e)
    error.value = '网络错误'
  } finally {
    loading.value = false
  }
}

const changePage = (p: number) => { if (p >= 1 && p <= pageData.value.pages) search(p) }

const reset = () => { keyword.value = ''; isActive.value = undefined; search(1) }

const openCreate = () => { 
  dialogMode.value = 'create'
  form.value = { slug: '' }
  dialogVisible.value = true
  dialogError.value = null 
}

const openEdit = (tag: BlogTagVO) => {
  dialogMode.value = 'edit'
  form.value = { id: tag.id, slug: tag.slug, isActive: tag.isActive ?? 1 }
  dialogVisible.value = true
  dialogError.value = null
}

const closeDialog = () => { dialogVisible.value = false }

const submitDialog = async () => {
  try {
    dialogError.value = null
    submitting.value = true
    if (!form.value.slug?.trim()) { dialogError.value = '请填写 slug'; return }

    if (dialogMode.value === 'create') {
      const dto: BlogTagCreateDTO = { slug: form.value.slug.trim() }
      await createTag(dto)
    } else {
      if (!form.value.id) { dialogError.value = '缺少ID'; return }
      const dto: BlogTagUpdateDTO = { id: form.value.id, slug: form.value.slug.trim(), isActive: form.value.isActive ?? 1 }
      await updateTag(form.value.id, dto)
    }
    closeDialog()
    search(pageData.value.pageNum)
  } catch (e: any) {
    dialogError.value = e?.msg || e?.message || '提交失败'
  } finally {
    submitting.value = false
  }
}

const remove = async (tag: BlogTagVO) => {
  try {
    if (!confirm(`确认删除标签 #${tag.id} (${tag.slug})?`)) return
    await deleteTag(tag.id)
    search(pageData.value.pageNum)
  } catch (e: any) {
    alert(e?.msg || e?.message || '删除失败')
  }
}

// Translation management functions
const openTranslations = async (tag: BlogTagVO) => {
  currentTag.value = tag
  translationDialogVisible.value = true
  translationError.value = null
  await loadTranslations(tag.id)
}

const closeTranslationDialog = () => {
  translationDialogVisible.value = false
  currentTag.value = null
  translations.value = []
  translationForm.value = { lang: '', name: '' }
  translationError.value = null
}

const loadTranslations = async (tagId: number) => {
  try {
    const res = await fetchTagTranslations(tagId)
    if (res.code === 0 && res.data) {
      translations.value = res.data
    }
  } catch (e) {
    console.error('Failed to load translations:', e)
  }
}

const addTranslation = async () => {
  try {
    translationError.value = null
    translationSubmitting.value = true
    
    if (!translationForm.value.lang?.trim()) {
      translationError.value = '请填写语言代码'
      return
    }
    if (!translationForm.value.name?.trim()) {
      translationError.value = '请填写标签名称'
      return
    }
    if (!currentTag.value) {
      translationError.value = '标签信息缺失'
      return
    }

    const dto: BlogTagTranslationDTO = {
      lang: translationForm.value.lang.trim(),
      name: translationForm.value.name.trim()
    }
    
    await createTagTranslation(currentTag.value.id, dto)
    translationForm.value = { lang: '', name: '' }
    await loadTranslations(currentTag.value.id)
    
    // Refresh main list to show updated translations
    search(pageData.value.pageNum)
  } catch (e: any) {
    translationError.value = e?.msg || e?.message || '添加翻译失败'
  } finally {
    translationSubmitting.value = false
  }
}

const editTranslation = (translation: BlogTagTranslationVO) => {
  editTranslationForm.value = {
    lang: translation.lang,
    name: translation.name
  }
  editTranslationDialogVisible.value = true
  editTranslationError.value = null
}

const closeEditTranslationDialog = () => {
  editTranslationDialogVisible.value = false
  editTranslationForm.value = { lang: '', name: '' }
  editTranslationError.value = null
}

const submitEditTranslation = async () => {
  try {
    editTranslationError.value = null
    editTranslationSubmitting.value = true
    
    if (!editTranslationForm.value.name?.trim()) {
      editTranslationError.value = '请填写标签名称'
      return
    }
    if (!currentTag.value) {
      editTranslationError.value = '标签信息缺失'
      return
    }

    const dto: BlogTagTranslationDTO = {
      lang: editTranslationForm.value.lang,
      name: editTranslationForm.value.name.trim()
    }
    
    await updateTagTranslation(currentTag.value.id, editTranslationForm.value.lang, dto)
    closeEditTranslationDialog()
    await loadTranslations(currentTag.value.id)
    
    // Refresh main list to show updated translations
    search(pageData.value.pageNum)
  } catch (e: any) {
    editTranslationError.value = e?.msg || e?.message || '更新翻译失败'
  } finally {
    editTranslationSubmitting.value = false
  }
}

const removeTranslation = async (translation: BlogTagTranslationVO) => {
  try {
    if (!confirm(`确认删除翻译 "${translation.lang}: ${translation.name}"?`)) return
    if (!currentTag.value) return
    
    await deleteTagTranslation(currentTag.value.id, translation.lang)
    await loadTranslations(currentTag.value.id)
    
    // Refresh main list to show updated translations
    search(pageData.value.pageNum)
  } catch (e: any) {
    alert(e?.msg || e?.message || '删除翻译失败')
  }
}

onMounted(() => {
  search(1)
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 20px; font-weight: 600; }
.actions { display: flex; gap: 8px; }
.filters { display: flex; gap: 8px; align-items: center; }
.card { overflow: hidden; }
.tag { padding: 2px 8px; border-radius: 12px; border: 1px solid #e4e7ed; font-size: 12px; }
.tag.success { color: #67c23a; background: #f0f9eb; border-color: #c2e7b0; }
.pagination { display: flex; justify-content: center; padding: 12px; }
.empty { text-align: center; color: #909399; }

.translations { display: flex; flex-wrap: wrap; gap: 4px; }
.translation-tag { margin: 2px 0; }
.no-translations { color: #909399; }

.translation-content { display: flex; flex-direction: column; gap: 16px; }
.tag-info h4 { margin: 0; color: #303133; }
.translation-form { padding: 16px; background: #f5f7fa; border-radius: 8px; }
.translation-list h5 { margin: 0 0 12px 0; color: #606266; }
</style>
