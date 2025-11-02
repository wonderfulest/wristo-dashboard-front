<template>
  <div class="page">
    <div class="page-header">
      <div class="title">博客目录管理</div>
    </div>

    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom: 12px;" />

    <div class="lang-switcher" role="navigation" aria-label="Language Switcher">
      <span class="label">Language</span>
      <div class="buttons">
        <button
          v-for="t in normalized"
          :key="t.lang"
          class="pill"
          :class="{ active: t.lang === currentLang }"
          type="button"
          @click="switchLanguage(t.lang)"
        >
          {{ t.lang.toUpperCase() }}
        </button>
      </div>
    </div>

    <el-card>
      <div class="tool-row">
        <el-button type="primary" @click="openCreateRoot">新增根节点</el-button>
      </div>

      <el-empty v-if="!loading && treeData.length === 0" description="暂无目录，点击新增根节点创建" />

      <el-tree
        v-else
        :data="treeData"
        node-key="id"
        :props="treeProps"
        default-expand-all
        draggable
        style="--el-tree-node-hover-bg-color: #f5f7fa;"
      >
        <template #default="{ data }">
          <div class="tree-row">
            <span class="node-title">{{ tocTitle(data) }}</span>
            <span class="muted" v-if="data.anchor">#{{ data.anchor }}</span>
            <span class="muted" v-if="data.post">（文章：{{ postTitle(data.post) }}）</span>
            <div class="node-actions">
              <el-button text size="small" @click.stop="openBind(data)">绑定文章</el-button>
              <el-button text size="small" @click.stop="openCreateChild(data)">新增子节点</el-button>
              <el-button text size="small" @click.stop="openEdit(data)">编辑</el-button>
              <el-button text size="small" type="danger" @click.stop="removeNode(data)">删除</el-button>
            </div>
          </div>
        </template>
      </el-tree>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增目录项' : '编辑目录项'" width="720px">
      <el-form label-width="110px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="标题" />
        </el-form-item>
        <el-form-item label="锚点(anchor)">
          <el-input v-model="form.anchor" placeholder="可选，如 section-1" />
        </el-form-item>
        <el-form-item label="排序索引">
          <el-input-number v-model="form.orderIndex" :min="0" :controls="false" placeholder="可选" />
        </el-form-item>
        <el-form-item label="层级(depth)">
          <el-input-number v-model="form.depth" :min="0" :controls="false" placeholder="可选" />
        </el-form-item>
        <el-form-item label="外链URL">
          <el-input v-model="form.linkUrl" placeholder="可选 https://..." />
        </el-form-item>
        <el-form-item v-if="dialogMode === 'edit'" label="状态">
          <el-select v-model="form.isActive" placeholder="请选择">
            <el-option :value="1" label="启用" />
            <el-option :value="0" label="停用" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="dialogMode === 'edit'" label="多语言标题">
          <el-tabs v-model="activeTransLang" type="card" editable @edit="onTransTabsEdit">
            <el-tab-pane
              v-for="t in (form.translations || [])"
              :key="t.lang"
              :label="t.lang || '未命名'"
              :name="t.lang"
            >
              <div style="display: flex; gap: 8px; align-items: center;">
                <el-select
                  v-model="t.lang"
                  placeholder="选择语言"
                  filterable
                  allow-create
                  default-first-option
                  style="max-width: 220px;"
                  @change="onLangChanged(t)"
                >
                  <el-option
                    v-for="l in systemLanguages"
                    :key="l"
                    :label="l"
                    :value="l"
                  />
                </el-select>
                <el-input v-model="t.title" placeholder="标题" />
              </div>
            </el-tab-pane>
          </el-tabs>
          <div class="muted" style="margin-top: 6px;">可通过标签栏右侧 + 按钮新增语言，单个标签的关闭按钮可删除该语言</div>
        </el-form-item>
        <el-alert v-if="dialogError" :title="dialogError" type="error" show-icon />
      </el-form>
      <template #footer>
        <span>
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitDialog">确 认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Bind Post Dialog -->
    <el-dialog v-model="bindDialogVisible" title="绑定文章" width="720px">
      <div class="bind-search">
        <el-input v-model="bindKeyword" placeholder="输入关键词 (标题/内容)" clearable style="max-width: 320px;" @keyup.enter="doSearchPosts" />
        <el-input v-model="bindLang" placeholder="语言(可选) 如 zh / en-US" clearable style="max-width: 160px;" @keyup.enter="doSearchPosts" />
        <el-input-number v-model="bindLimit" :min="1" :max="100" :controls="false" placeholder="返回条数" style="max-width: 120px;" />
        <el-button type="primary" :loading="bindLoading" @click="doSearchPosts">搜索</el-button>
      </div>

      <el-alert v-if="bindError" :title="bindError" type="error" show-icon style="margin: 8px 0;" />

      <el-table :data="bindResults" v-loading="bindLoading" height="360px" style="width: 100%;">
        <el-table-column label="选择" width="80">
          <template #default="{ row }">
            <el-radio :model-value="selectedPostId" :label="row.id" @change="() => (selectedPostId = row.id)" />
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column label="标题">
          <template #default="{ row }">
            <div class="title-line">{{ firstTitle(row) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="语言" width="140">
          <template #default="{ row }">{{ joinTrans(row, 'lang') }}</template>
        </el-table-column>
      </el-table>

      <template #footer>
        <span>
          <el-button @click="bindDialogVisible = false">取 消</el-button>
          <el-button type="primary" :disabled="!selectedPostId || !currentTocId" :loading="bindSubmitting" @click="submitBind">绑 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { BlogPostVO, BlogPostTocItemVO, BlogPostTocItemCreateDTO, BlogPostTocItemUpdateDTO, BlogPostTocItemTranslationDTO } from '@/types/blog'
import { fetchTocTree, createTocItem, updateTocItem, deleteTocItem, searchBlogPosts, bindTocItemPost, fetchTocItemDetail } from '@/api/blog'
import { fetchSystemLanguages } from '@/api/system'

const parentId = ref<number>(-1)
const loading = ref(false)
const error = ref<string | null>(null)
const treeData = ref<BlogPostTocItemVO[]>([])

const treeProps = { children: 'children', label: 'title' }
const systemLanguages = ref<string[]>([])
const activeTransLang = ref<string>('')
const currentLang = ref<string>('')
const normalized = computed(() => (systemLanguages.value || []).map(l => ({ lang: l })))

const switchLanguage = (lang: string) => {
  currentLang.value = lang
  loadTree()
}

const loadTree = async () => {
  if (typeof parentId.value !== 'number') { error.value = '请先输入父节点ID(默认 -1)'; return }
  try {
    loading.value = true
    error.value = null
    const res = await fetchTocTree({ parentId: parentId.value }, currentLang.value || undefined)
    if ((res as any)?.code === 0 && Array.isArray((res as any)?.data)) {
      treeData.value = (res as any).data
    } else {
      error.value = (res as any)?.msg || '加载失败'
    }
  } catch (e: any) {
    error.value = e?.message || '网络错误'
  } finally {
    loading.value = false
  }
}

// Bind post to TOC item
const bindDialogVisible = ref(false)
const bindKeyword = ref('')
const bindLang = ref('')
const bindLimit = ref<number | undefined>(20)
const bindLoading = ref(false)
const bindSubmitting = ref(false)
const bindError = ref<string | null>(null)
const bindResults = ref<BlogPostVO[]>([])
const selectedPostId = ref<number | null>(null)
const currentTocId = ref<number | null>(null)

const firstTitle = (row: BlogPostVO) => {
  if (row.title) return row.title
  const t = Array.isArray(row.translations) ? row.translations[0] : null
  return t?.title || `文章#${row.id}`
}

const postTitle = (row: BlogPostVO | null) => {
  if (!row) return ''
  if (row.title) return row.title
  const t = Array.isArray(row.translations) ? row.translations[0] : null
  return t?.title || `文章#${row.id}`
}

const joinTrans = (row: BlogPostVO, key: 'slug' | 'lang'): string => {
  const arr = Array.isArray(row.translations) ? row.translations : []
  const vals = arr
    .map((t: any) => (t && typeof t[key] === 'string' ? t[key] : undefined))
    .filter((v): v is string => Boolean(v && v.length > 0))
  return vals.length ? vals.join(', ') : '—'
}

const tocTitle = (n: BlogPostTocItemVO): string => {
  const arr: any[] = Array.isArray((n as any).translations) ? (n as any).translations : []
  if (currentLang.value) {
    const t = arr.find((x: any) => x && x.lang === currentLang.value)
    if (t && typeof t.title === 'string' && t.title.length) return t.title
  }
  if (typeof (n as any).title === 'string' && (n as any).title.length) return (n as any).title
  const t0 = arr[0]
  return (t0 && t0.title) ? t0.title : `#${n.id}`
}

const openBind = (node: BlogPostTocItemVO) => {
  currentTocId.value = node.id
  bindDialogVisible.value = true
  bindKeyword.value = ''
  bindLang.value = ''
  bindResults.value = []
  selectedPostId.value = null
  bindError.value = null
}

const doSearchPosts = async () => {
  try {
    bindLoading.value = true
    bindError.value = null
    const res = await searchBlogPosts({
      keyword: bindKeyword.value || null,
      lang: bindLang.value || null,
      limit: bindLimit.value ?? null
    })
    if ((res as any)?.code === 0 && Array.isArray((res as any)?.data)) bindResults.value = (res as any).data
    else bindError.value = (res as any)?.msg || '搜索失败'
  } catch (e: any) {
    bindError.value = e?.message || '网络错误'
  } finally {
    bindLoading.value = false
  }
}

const submitBind = async () => {
  if (!currentTocId.value || !selectedPostId.value) return
  try {
    bindSubmitting.value = true
    const res = await bindTocItemPost({ id: currentTocId.value, postId: selectedPostId.value })
    if ((res as any)?.code === 0 || (res as any) === true || (res as any)?.data === true) {
      ElMessage.success('绑定成功')
      bindDialogVisible.value = false
      await loadTree()
    } else {
      ElMessage.error((res as any)?.msg || '绑定失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '绑定失败')
  } finally {
    bindSubmitting.value = false
  }
}

onMounted(async () => {
  loadTree()
  try {
    const res = await fetchSystemLanguages()
    const list = (res as any)?.data
    if (Array.isArray(list)) systemLanguages.value = list as string[]
    currentLang.value = systemLanguages.value[0] || ''
    loadTree()
  } catch {}
})

// Dialog state
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editParentId = ref<number | null>(null)
const form = ref<Partial<BlogPostTocItemUpdateDTO & BlogPostTocItemCreateDTO>>({ title: '', orderIndex: 0, depth: 0, linkUrl: '', anchor: '' })
const dialogError = ref<string | null>(null)
const submitting = ref(false)

const openCreateRoot = () => { openCreateChild(null as any) }

const openCreateChild = (p: BlogPostTocItemVO | null) => {
  dialogMode.value = 'create'
  editParentId.value = p?.id ?? null
  form.value = { title: '', anchor: '', orderIndex: 0, depth: (p?.depth ?? -1) + 1, linkUrl: '' }
  dialogError.value = null
  dialogVisible.value = true
}

const openEdit = async (n: BlogPostTocItemVO) => {
  dialogMode.value = 'edit'
  editParentId.value = n.parentId ?? null
  dialogError.value = null
  dialogVisible.value = true
  try {
    const res = await fetchTocItemDetail(n.id)
    const item = (res as any)?.data || n
    form.value = {
      id: item.id,
      title: item.title,
      anchor: item.anchor ?? '',
      orderIndex: item.orderIndex ?? 0,
      depth: item.depth ?? 0,
      linkUrl: item.linkUrl ?? '',
      isActive: item.isActive ?? 1,
      translations: Array.isArray(item.translations)
        ? item.translations.map((t: any) => ({ id: t.id, tocItemId: t.tocItemId, lang: t.lang, title: t.title, isActive: t.isActive }))
        : []
    }
    const langs = ((form.value.translations as any[]) || []).map(x => x.lang)
    activeTransLang.value = (currentLang.value && langs.includes(currentLang.value)) ? currentLang.value : (langs[0] || '')
  } catch (e: any) {
    // fallback to basic info if detail fails
    form.value = { id: n.id, title: n.title, anchor: n.anchor ?? '', orderIndex: n.orderIndex ?? 0, depth: n.depth ?? 0, linkUrl: n.linkUrl ?? '', isActive: n.isActive ?? 1, translations: [] }
    activeTransLang.value = ''
  }
}

const suggestNextLang = (): string => {
  const used = new Set((form.value.translations || []).map((t: any) => t.lang).filter(Boolean))
  const candidates = systemLanguages.value.length ? systemLanguages.value : []
  for (const l of candidates) {
    if (!used.has(l)) return l
  }
  // fallback
  let base = 'lang'
  let idx = 1
  let val = `${base}-${idx}`
  while (used.has(val)) { idx += 1; val = `${base}-${idx}` }
  return val
}

const onTransTabsEdit = (targetName: any, action: 'add' | 'remove') => {
  if (!Array.isArray(form.value.translations)) form.value.translations = [] as any
  if (action === 'add') {
    const lang = suggestNextLang()
    ;(form.value.translations as BlogPostTocItemTranslationDTO[]).push({ lang, title: '' })
    activeTransLang.value = lang
  } else if (action === 'remove') {
    const arr = form.value.translations as BlogPostTocItemTranslationDTO[]
    const idx = arr.findIndex(t => t.lang === targetName)
    if (idx >= 0) arr.splice(idx, 1)
    if (activeTransLang.value === targetName) {
      activeTransLang.value = arr[0]?.lang || ''
    }
  }
}

const onLangChanged = (t: BlogPostTocItemTranslationDTO) => {
  if (!t) return
  const arr = (form.value.translations as BlogPostTocItemTranslationDTO[]) || []
  // ensure unique
  const duplicates = arr.filter(x => x !== t && x.lang === t.lang)
  if (duplicates.length) {
    let base = t.lang || 'lang'
    let idx = 1
    let newLang = `${base}-${idx}`
    const used = new Set(arr.map(x => x.lang))
    while (used.has(newLang)) { idx += 1; newLang = `${base}-${idx}` }
    t.lang = newLang
  }
  activeTransLang.value = t.lang || ''
}

const submitDialog = async () => {
  if (!form.value.title || !form.value.title.trim()) { dialogError.value = '请填写标题'; return }
  try {
    submitting.value = true
    if (dialogMode.value === 'create') {
      const dto: BlogPostTocItemCreateDTO = {
        parentId: editParentId.value ?? undefined,
        title: String(form.value.title).trim(),
        anchor: form.value.anchor || undefined,
        orderIndex: typeof form.value.orderIndex === 'number' ? form.value.orderIndex : undefined,
        depth: typeof form.value.depth === 'number' ? form.value.depth : undefined,
        linkUrl: form.value.linkUrl || undefined,
      }
      const res = await createTocItem(dto)
      if ((res as any)?.code !== 0) throw new Error((res as any)?.msg || '创建失败')
    } else {
      const dto: BlogPostTocItemUpdateDTO = {
        id: form.value.id as number,
        parentId: editParentId.value ?? undefined,
        title: form.value.title ? String(form.value.title).trim() : undefined,
        anchor: form.value.anchor || undefined,
        orderIndex: typeof form.value.orderIndex === 'number' ? form.value.orderIndex : undefined,
        depth: typeof form.value.depth === 'number' ? form.value.depth : undefined,
        linkUrl: form.value.linkUrl || undefined,
        isActive: typeof form.value.isActive === 'number' ? form.value.isActive : undefined,
        translations: Array.isArray(form.value.translations)
          ? (form.value.translations as BlogPostTocItemTranslationDTO[]).map(t => ({
              id: t.id ?? undefined,
              tocItemId: t.tocItemId ?? undefined,
              lang: String(t.lang || '').trim(),
              title: String(t.title || '').trim()
            }))
          : undefined
      }
      const res = await updateTocItem(dto)
      if ((res as any)?.code !== 0) throw new Error((res as any)?.msg || '更新失败')
    }
    dialogVisible.value = false
    await loadTree()
    ElMessage.success('已保存')
  } catch (e: any) {
    dialogError.value = e?.message || '提交失败'
  } finally {
    submitting.value = false
  }
}

const removeNode = async (n: BlogPostTocItemVO) => {
  try {
    await ElMessageBox.confirm(`确认删除「${n.title}」?`, '删除确认', { type: 'warning' })
    const res = await deleteTocItem(n.id)
    if ((res as any)?.code === 0 || (res as any) === true || (res as any)?.data === true) {
      ElMessage.success('删除成功')
      await loadTree()
    } else {
      ElMessage.error((res as any)?.msg || '删除失败')
    }
  } catch (e: any) {
    if (e === 'cancel') return
    ElMessage.error(e?.message || '操作失败')
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 20px; font-weight: 600; }
.actions { display: flex; gap: 8px; align-items: center; }
.tool-row { margin-bottom: 10px; display: flex; gap: 8px; }
.tree-row { display: flex; align-items: center; gap: 12px; padding: 6px 4px; }
.node-title { font-weight: 500; }
.node-actions { margin-left: auto; display: flex; gap: 4px; }
.muted { color: #909399; font-size: 12px; }
.lang-switcher { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.lang-switcher .label { font-size: 12px; color: #909399; }
.lang-switcher .buttons { display: flex; gap: 6px; flex-wrap: wrap; }
.pill { border: 1px solid #dcdfe6; background: #fff; border-radius: 999px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
.pill.active { background: #409EFF; color: #fff; border-color: #409EFF; }
</style>
