<template>
  <div class="glyph-assets-container">
    <div class="header">
      <h2>字体素材管理</h2>
      <div class="ops">
        <el-button @click="goBack">返回</el-button>
        <el-button type="success" @click="openImport">导入素材</el-button>
        <el-button type="primary" @click="fetchData">刷新</el-button>
      </div>
    </div>

    <el-alert
      v-if="hasMissingAsset"
      title="该 Glyph 存在未绑定的字体素材，请前往绑定"
      type="warning"
      show-icon
      :closable="false"
      class="mb16"
    />

    <el-table :data="rows" v-loading="loading" border style="width: 100%">
      <el-table-column label="#" width="60">
        <template #default="{ $index }">{{ $index + 1 + (pageNum - 1) * pageSize }}</template>
      </el-table-column>
      <el-table-column label="Icon Label" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.icon?.label || '-' }}</template>
      </el-table-column>
      <el-table-column label="symbol" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ row.icon?.symbolCode || '-' }}</template>
      </el-table-column>
      <el-table-column label="unicode" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ row.icon?.iconUnicode || '-' }}</template>
      </el-table-column>
      <el-table-column label="素材预览" width="120">
        <template #default="{ row }">
          <template v-if="row.asset && Object.keys(row.asset).length">
            <el-image :src="getPreviewUrl(row.asset.previewUrl || row.asset.imageUrl)" fit="contain" style="width:48px;height:48px;border-radius:6px;border:1px solid #eee;" />
          </template>
          <span v-else class="warn bind-missing" @click="openBind(row)">未绑定素材</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" type="primary" text @click="openBind(row)">重新绑定</el-button>
          <el-button
            size="small"
            text
            type="primary"
            :disabled="!(row.asset && row.asset.id)"
            @click="openEdit(row)"
          >编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination mb16">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="onSizeChange"
        @current-change="onPageChange"
      />
    </div>

    <el-dialog v-model="importVisible" title="导入字体素材" width="760px">
      <div class="bind-toolbar" style="margin-bottom:12px; display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <el-input v-model="importKeyword" placeholder="关键词 (glyphCode)" clearable style="width: 240px" @keyup.enter.native="fetchImportList" />
        <el-input-number v-model="importIconId" :min="1" placeholder="IconID(可选)" controls-position="right" />
        <el-button type="primary" @click="fetchImportList">搜索</el-button>
      </div>
      <el-table :data="importRows" v-loading="importLoading" border height="380px">
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="glyphCode" label="glyphCode" min-width="200" />
        <el-table-column prop="style" label="style" width="160" />
        <el-table-column label="启用" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="selectImport(row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="importPageNum"
          v-model:page-size="importPageSize"
          :total="importTotal"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="onImportSizeChange"
          @current-change="onImportPageChange"
        />
      </div>
      <template #footer>
        <el-button @click="importVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <BindIconAssetDialog
      v-model="bindVisible"
      :icon-id="bindTarget?.icon?.id || 0"
      @select="confirmBind"
    />

    <SvgEditor v-model="editVisible" :asset-id="editingId" @saved="onEdited" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { bindAssetsToGlyph, pageIconGlyphAsset, importToGlyph } from '@/api/icon-glyph-asset'
import { pageIconGlyph } from '@/api/icon-glyph'
import type { IconGlyphAssetVO } from '@/types/icon-glyph-asset'
import type { IconAssetVO } from '@/types/icon-asset'
import type { IconGlyphVO } from '@/types/icon-glyph'
import SvgEditor from './components/SvgEditor.vue'
import BindIconAssetDialog from './components/BindIconAssetDialog.vue'

const route = useRoute()
const router = useRouter()
const glyphId = Number(route.params.glyphId)

const rows = ref<IconGlyphAssetVO[]>([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(50)
const total = ref(0)

const hasMissingAsset = computed(() => rows.value.some(r => !r.asset || Object.keys(r.asset || {}).length === 0))

const fetchData = async () => {
  if (!glyphId) return
  loading.value = true
  try {
    const resp = await pageIconGlyphAsset({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      glyphId,
      orderBy: 'id:asc'
    } as any)
    const data = (resp as any)?.data
    rows.value = data?.list || []
    total.value = data?.total || 0
  } catch (e) {
    ElMessage.error('获取字体素材失败')
  } finally {
    loading.value = false
  }
}

const onSizeChange = (val: number) => { pageSize.value = val; pageNum.value = 1; fetchData() }
const onPageChange = (val: number) => { pageNum.value = val; fetchData() }

// Edit asset via SvgEditor
const editVisible = ref(false)
const editingId = ref<number | null>(null)
const openEdit = (row: IconGlyphAssetVO) => {
  const id = (row as any)?.asset?.id as number | undefined
  if (!id) {
    ElMessage.warning('该行未绑定素材，无法编辑')
    return
  }
  editingId.value = id
  editVisible.value = true
}
const onEdited = () => {
  fetchData()
}

// Bind dialog state
const bindVisible = ref(false)
let bindTarget: IconGlyphAssetVO | null = null

const openBind = (row: IconGlyphAssetVO) => {
  bindTarget = row
  bindVisible.value = true
}

const confirmBind = async (asset: IconAssetVO) => {
  if (!glyphId || !asset?.id) return
  try {
    await bindAssetsToGlyph(glyphId, asset.id)
    // 成功后刷新当前分页数据
    await fetchData()
    ElMessage.success('绑定成功')
    bindVisible.value = false
  } catch (e) {
    ElMessage.error('绑定失败')
  }
}

const goBack = () => {
  router.push({ name: 'IconGlyphs' })
}

const getPreviewUrl = (url?: string) => {
  if (!url) return ''
  const lower = url.toLowerCase()
  if (lower.endsWith('.svg') || lower.includes('.svg?')) return url
  const [base, query] = url.split('?')
  const lastDot = base.lastIndexOf('.')
  if (lastDot === -1) return url
  const prefix = base.substring(0, lastDot)
  const ext = base.substring(lastDot)
  const withSize = `${prefix}_128x128${ext}`
  return query ? `${withSize}?${query}` : withSize
}

// Import from other glyph
const importVisible = ref(false)
const importLoading = ref(false)
const importRows = ref<IconGlyphVO[]>([])
const importKeyword = ref<string | undefined>(undefined)
const importIconId = ref<number | undefined>(undefined)
const importPageNum = ref(1)
const importPageSize = ref(20)
const importTotal = ref(0)

const openImport = () => {
  importPageNum.value = 1
  fetchImportList()
  importVisible.value = true
}

const fetchImportList = async () => {
  importLoading.value = true
  try {
    const resp = await pageIconGlyph({
      pageNum: importPageNum.value,
      pageSize: importPageSize.value,
      keyword: importKeyword.value,
      iconId: importIconId.value
    } as any)
    const data = (resp as any)?.data
    importRows.value = data?.list || []
    importTotal.value = data?.total || 0
  } catch (e) {
    ElMessage.error('获取字体列表失败')
  } finally {
    importLoading.value = false
  }
}

const onImportSizeChange = (val: number) => { importPageSize.value = val; fetchImportList() }
const onImportPageChange = (val: number) => { importPageNum.value = val; fetchImportList() }

const selectImport = async (row: IconGlyphVO) => {
  if (!row?.id || !glyphId) return
  try {
    await importToGlyph(row.id, glyphId)
    ElMessage.success('导入成功')
    importVisible.value = false
    fetchData()
  } catch (e) {
    ElMessage.error('导入失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.glyph-assets-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.ops { display: flex; gap: 8px; }
.mb16 { margin-bottom: 16px; }
.muted { color: #909399; }
.warn { color: #E6A23C; }
.bind-missing { cursor: pointer; text-decoration: underline; }
.bind-toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
.pagination { margin-top: 12px; display: flex; justify-content: flex-end; }
</style>
