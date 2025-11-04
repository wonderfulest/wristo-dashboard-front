<template>
  <div class="icon-glyphs-container">
    <div class="header">
      <h2>图标字体管理</h2>
      <div class="tools">
        <el-input v-model="keyword" placeholder="关键词 (名称/Unicode/别名)" clearable style="width: 240px" @keyup.enter.native="handleSearch" />
        <el-input-number v-model="iconId" :min="1" placeholder="IconID" controls-position="right" @change="handleSearch" />
        <el-button type="success" @click="openCreate">新增</el-button>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="fetchPage">刷新</el-button>
      </div>
    </div>

    <el-table :data="rows" v-loading="loading" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="glyphCode" label="glyphCode" min-width="180" />
      <el-table-column prop="style" label="style" width="140" />
      <el-table-column prop="isDefault" label="默认" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="row.isDefault === 1 ? 'success' : 'info'">{{ row.isDefault === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isActive" label="启用" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" min-width="180" />
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="openGlyph(row)">查看</el-button>
          <el-button size="small" text type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" text type="success" @click="downloadGlyphAssets(row)">下载</el-button>
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

    <GlyphCreateDialog v-model="createVisible" @created="fetchPage" />
    <GlyphEditDialog v-model="editVisible" :glyph="editingGlyph" @updated="fetchPage" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { IconAsset, IconGlyphVO, IconLibrary } from '@/types/icon-glyph'
import { pageIconGlyph, removeIconGlyph } from '@/api/icon-glyph'
import { getGlyphAssets } from '@/api/icon-glyph-asset'
import type { IconGlyphAssetVO } from '@/types/icon-glyph-asset'
import GlyphCreateDialog from './components/GlyphCreateDialog.vue'
import GlyphEditDialog from './components/GlyphEditDialog.vue'

const rows = ref<IconGlyphVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const keyword = ref<string | undefined>(undefined)
const iconId = ref<number | undefined>(undefined)

const createVisible = ref(false)
const editVisible = ref(false)
const editingGlyph = ref<IconGlyphVO | null>(null)

const fetchPage = async () => {
  loading.value = true
  try {
    const resp = (await pageIconGlyph({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      iconId: iconId.value
    })) as unknown as ApiResponse<PageResponse<IconGlyphVO>>
    rows.value = resp.data?.list || []
    total.value = resp.data?.total || 0
  } catch (e) {
    ElMessage.error('获取图标字体列表失败')
  } finally {
    loading.value = false
  }
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

import { useRouter } from 'vue-router'
const router = useRouter()
const openGlyph = (row: IconGlyphVO) => {
  if (!row?.id) return
  router.push({ name: 'IconGlyphAssets', params: { glyphId: row.id } })
}

const ensureJsZip = (): Promise<any> => {
  const w = window as any
  if (w.JSZip) return Promise.resolve(w.JSZip)
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
    s.onload = () => resolve((window as any).JSZip)
    s.onerror = reject
    document.head.appendChild(s)
  })
}

const saveBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadGlyphAssets = async (row: IconGlyphVO) => {
  if (!row?.id) return
  try {
    const resp: ApiResponse<IconGlyphAssetVO[]> = await getGlyphAssets(row.id)
    const list = resp.data || []
    const entries: { name: string; content: string }[] = []
    const nameCount: Record<string, number> = {}
    for (const it of list) {
      const asset: IconAsset = it.asset || {}
      const icon: IconLibrary = it.icon || {}
      const svg: string = asset.svgContent || ''
      const unicodeRaw: string = icon.iconUnicode || ''
      const baseCode: string = unicodeRaw && unicodeRaw.trim() ? unicodeRaw.trim() : icon.symbolCode || ''
      if (svg && baseCode) {
        console.log(baseCode)
        let base = `${baseCode}.svg`
        if (nameCount[base] == null) nameCount[base] = 0
        nameCount[base] += 1
        const finalName = nameCount[base] > 1 ? `${baseCode}_${nameCount[base]}.svg` : base
        entries.push({ name: finalName, content: svg })
      }
    }
    if (!entries.length) {
      ElMessage.warning('没有可下载的 SVG 内容')
      return
    }
    const JSZip = await ensureJsZip()
    const zip = new JSZip()
    for (const f of entries) {
      zip.file(f.name, f.content)
    }
    const blob: Blob = await zip.generateAsync({ type: 'blob' })
    const zipName = `${row.glyphCode || 'glyph'}-${row.id}.zip`
    saveBlob(zipName, blob)
    ElMessage.success('打包下载已开始')
  } catch (e) {
    ElMessage.error('下载失败')
  }
}

const confirmRemove = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认删除该Glyph？', '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    await removeIconGlyph(id)
    ElMessage.success('删除成功')
    fetchPage()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const openCreate = () => { createVisible.value = true }
const openEdit = (row: IconGlyphVO) => { editingGlyph.value = row; editVisible.value = true }

onMounted(() => {
  fetchPage()
})
</script>

<style scoped>
.icon-glyphs-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.tools { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
