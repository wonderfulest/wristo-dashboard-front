<template>
  <div class="page">
    <div class="page-header">
      <div class="title">分类管理</div>
      <div class="actions">
        <el-button type="primary" @click="openCreate">新建分类</el-button>
      </div>
    </div>

    <div class="filters">
      <el-input 
        v-model.trim="keyword" 
        placeholder="关键词 (slug)" 
        @keyup.enter="search(1)"
        style="width: 220px"
      />
      <el-input 
        v-model.trim="langCode" 
        placeholder="语言 (默认 en-US)" 
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

    <div class="card">
      <el-table :data="pageData.list" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="slug" label="Slug" />
        <el-table-column prop="langCode" label="语言" width="120">
          <template #default="{ row }">{{ row.langCode || '—' }}</template>
        </el-table-column>
        <el-table-column prop="name" label="名称" width="180">
          <template #default="{ row }">{{ row.name || '—' }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述">
          <template #default="{ row }">{{ row.description || '—' }}</template>
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
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
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

    <!-- Dialogs -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogMode === 'create' ? '新建分类' : '编辑分类'"
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PageResponse } from '@/types/api'
import type { BlogCategoryVO, BlogCategoryPageQueryDTO, BlogCategoryCreateDTO, BlogCategoryUpdateDTO } from '@/types/blog'
import { fetchCategoryPage, createCategory, updateCategory, deleteCategory } from '@/api/blog'

const loading = ref(true)
const error = ref<string | null>(null)
const pageData = ref<PageResponse<BlogCategoryVO>>({ pageNum: 1, pageSize: 10, total: 0, pages: 0, list: [] })

const keyword = ref('')
const isActive = ref<number | undefined>(undefined)
const langCode = ref<string>('')

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const form = ref<{ id?: number; slug: string; isActive?: number }>({ slug: '' })
const dialogError = ref<string | null>(null)
const submitting = ref(false)

const fmtDate = (v?: string | null) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN')
}

const search = async (pageNum = 1) => {
  try {
    loading.value = true
    error.value = null
    const dto: BlogCategoryPageQueryDTO = {
      pageNum,
      pageSize: pageData.value.pageSize,
      keyword: keyword.value || null,
      isActive: typeof isActive.value === 'number' ? isActive.value : null,
      lang: langCode.value || null
    }
    const res = await fetchCategoryPage(dto)
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

const reset = () => { keyword.value = ''; isActive.value = undefined; langCode.value = ''; search(1) }

const openCreate = () => { dialogMode.value = 'create'; form.value = { slug: '' }; dialogVisible.value = true; dialogError.value = null }

const openEdit = (c: BlogCategoryVO) => {
  dialogMode.value = 'edit'
  form.value = { id: c.id, slug: c.slug, isActive: c.isActive ?? 1 }
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
      const dto: BlogCategoryCreateDTO = { slug: form.value.slug.trim() }
      await createCategory(dto, langCode.value || undefined)
    } else {
      if (!form.value.id) { dialogError.value = '缺少ID'; return }
      const dto: BlogCategoryUpdateDTO = { id: form.value.id, slug: form.value.slug.trim(), isActive: form.value.isActive ?? 1 }
      await updateCategory(form.value.id, dto, langCode.value || undefined)
    }
    closeDialog()
    search(pageData.value.pageNum)
  } catch (e: any) {
    dialogError.value = e?.msg || e?.message || '提交失败'
  } finally {
    submitting.value = false
  }
}

const remove = async (c: BlogCategoryVO) => {
  try {
    if (!confirm(`确认删除分类 #${c.id} (${c.slug})?`)) return
    await deleteCategory(c.id)
    search(pageData.value.pageNum)
  } catch (e: any) {
    alert(e?.msg || e?.message || '删除失败')
  }
}

onMounted(() => search(1))
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 20px; font-weight: 600; }
.actions { display: flex; gap: 8px; }
.filters { display: flex; gap: 8px; align-items: center; }
.card { background: #fff; border: 1px solid #ebeef5; border-radius: 8px; overflow: hidden; }
.tag { padding: 2px 8px; border-radius: 12px; border: 1px solid #e4e7ed; font-size: 12px; }
.tag.success { color: #67c23a; background: #f0f9eb; border-color: #c2e7b0; }
.pagination { display: flex; justify-content: center; padding: 12px; }
.empty { text-align: center; color: #909399; }
</style>
