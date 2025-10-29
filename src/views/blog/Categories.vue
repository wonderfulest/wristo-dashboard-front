<template>
  <div class="page">
    <div class="page-header">
      <div class="title">分类管理</div>
      <div class="actions">
        <button class="btn" @click="openCreate">新建分类</button>
      </div>
    </div>

    <div class="filters">
      <input v-model.trim="keyword" class="input" placeholder="关键词 (slug)" @keyup.enter="search(1)" />
      <input v-model.trim="langCode" class="input" placeholder="语言 (默认 en-US)" @keyup.enter="search(1)" />
      <select v-model="isActive" class="select">
        <option :value="undefined">状态</option>
        <option :value="1">启用</option>
        <option :value="0">停用</option>
      </select>
      <button class="btn" @click="search(1)" :disabled="loading">搜索</button>
      <button class="btn secondary" @click="reset" :disabled="loading">重置</button>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

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
            <button class="btn" @click="openEdit(row)">编辑</button>
            <button class="btn danger" @click="remove(row)">删除</button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty">暂无数据</div>
        </template>
      </el-table>

      <div class="pagination" v-if="pageData.pages > 1">
        <button class="btn" :disabled="pageData.pageNum <= 1 || loading" @click="changePage(pageData.pageNum - 1)">上一页</button>
        <span class="page-info">第 {{ pageData.pageNum }} / {{ pageData.pages }} 页，共 {{ pageData.total }} 条</span>
        <button class="btn" :disabled="pageData.pageNum >= pageData.pages || loading" @click="changePage(pageData.pageNum + 1)">下一页</button>
      </div>
    </div>

    <!-- Dialogs -->
    <div v-if="dialogVisible" class="dialog-mask">
      <div class="dialog">
        <div class="dialog-title">{{ dialogMode === 'create' ? '新建分类' : '编辑分类' }}</div>
        <div class="dialog-body">
          <div class="form-row">
            <label>Slug</label>
            <input v-model.trim="form.slug" type="text" class="input" placeholder="slug" />
          </div>
          <div class="form-row" v-if="dialogMode === 'edit'">
            <label>状态</label>
            <select v-model.number="form.isActive" class="select">
              <option :value="1">启用</option>
              <option :value="0">停用</option>
            </select>
          </div>
          <div class="error" v-if="dialogError">{{ dialogError }}</div>
        </div>
        <div class="dialog-footer">
          <button class="btn" @click="closeDialog">取消</button>
          <button class="btn primary" :disabled="submitting" @click="submitDialog">{{ submitting ? '提交中...' : '确认' }}</button>
        </div>
      </div>
    </div>
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
.input, .select { padding: 6px 10px; border: 1px solid #dcdfe6; border-radius: 6px; min-width: 220px; }
.btn { padding: 6px 12px; border: 1px solid #dcdfe6; background: #fff; border-radius: 6px; cursor: pointer; }
.btn.secondary { background: #f5f7fa; }
.btn.danger { color: #f56c6c; border-color: #fbc4c4; }
.card { background: #fff; border: 1px solid #ebeef5; border-radius: 8px; overflow: hidden; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 10px 12px; border-bottom: 1px solid #f2f3f5; text-align: left; vertical-align: top; }
.tag { padding: 2px 8px; border-radius: 12px; border: 1px solid #e4e7ed; font-size: 12px; }
.tag.success { color: #67c23a; background: #f0f9eb; border-color: #c2e7b0; }
.pagination { display: flex; gap: 8px; align-items: center; padding: 12px; }
.page-info { color: #606266; }
.empty { text-align: center; color: #909399; }
/* simple dialog */
.dialog-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; }
.dialog { width: 520px; background: #fff; border-radius: 8px; box-shadow: 0 6px 24px rgba(0,0,0,0.15); }
.dialog-title { padding: 12px 16px; font-weight: 600; border-bottom: 1px solid #eee; }
.dialog-body { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
.dialog-footer { padding: 12px 16px; display:flex; gap: 8px; justify-content: flex-end; border-top: 1px solid #eee; }
.form-row { display:flex; flex-direction: column; gap:6px; }
</style>
