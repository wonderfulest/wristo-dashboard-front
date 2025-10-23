<template>
  <div class="glyph-assets-container">
    <div class="header">
      <h2>字体素材管理</h2>
      <div class="ops">
        <el-button @click="goBack">返回</el-button>
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
        <template #default="{ $index }">{{ $index + 1 }}</template>
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

    <el-dialog v-model="bindVisible" title="绑定字体素材" width="760px">
      <div class="bind-toolbar">
        <el-input v-model="bindKeyword" placeholder="关键词 (assetCode/作者/标签)" clearable style="width: 260px" @keyup.enter.native="fetchBindList" />
        <el-button type="primary" @click="fetchBindList">搜索</el-button>
      </div>
      <el-table :data="bindRows" v-loading="bindLoading" border height="380px">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="预览" width="80">
          <template #default="{ row }">
            <el-image v-if="row.previewUrl || row.imageUrl" :src="getPreviewUrl(row.previewUrl || row.imageUrl)" fit="contain" style="width:40px;height:40px;border-radius:6px;border:1px solid #eee;" />
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="format" label="格式" width="120" />
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column prop="author" label="作者" min-width="120" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="confirmBind(row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="bindPageNum"
          v-model:page-size="bindPageSize"
          :total="bindTotal"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="onBindSizeChange"
          @current-change="onBindPageChange"
        />
      </div>
      <template #footer>
        <el-button @click="bindVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <SvgEditor v-model="editVisible" :asset-id="editingId" @saved="onEdited" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getGlyphAssets, bindAssetsToGlyph } from '@/api/icon-glyph-asset'
import type { IconGlyphAssetVO } from '@/types/icon-glyph-asset'
import { pageIconAsset } from '@/api/icon-asset'
import type { IconAssetVO } from '@/types/icon-asset'
import SvgEditor from './components/SvgEditor.vue'

const route = useRoute()
const router = useRouter()
const glyphId = Number(route.params.glyphId)

const rows = ref<IconGlyphAssetVO[]>([])
const loading = ref(false)

const hasMissingAsset = computed(() => rows.value.some(r => !r.asset || Object.keys(r.asset || {}).length === 0))

const fetchData = async () => {
  if (!glyphId) return
  loading.value = true
  try {
    const resp = await getGlyphAssets(glyphId)
    rows.value = (resp as any)?.data || []
  } catch (e) {
    ElMessage.error('获取字体素材失败')
  } finally {
    loading.value = false
  }
}

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
const bindLoading = ref(false)
const bindRows = ref<IconAssetVO[]>([])
const bindKeyword = ref<string>('')
const bindPageNum = ref(1)
const bindPageSize = ref(20)
const bindTotal = ref(0)
let bindTarget: IconGlyphAssetVO | null = null

const openBind = (row: IconGlyphAssetVO) => {
  bindTarget = row
  bindVisible.value = true
  bindPageNum.value = 1
  fetchBindList()
}

const fetchBindList = async () => {
  if (!bindTarget) return
  const iconId = bindTarget.icon?.id
  if (!iconId) {
    ElMessage.warning('缺少 Icon 信息，无法查询素材')
    return
  }
  bindLoading.value = true
  try {
    const resp = await pageIconAsset({
      pageNum: bindPageNum.value,
      pageSize: bindPageSize.value,
      iconId: iconId,
      keyword: bindKeyword.value,
      orderBy: 'id desc'
    } as any)
    const data = (resp as any)?.data
    bindRows.value = data?.list || []
    bindTotal.value = data?.total || 0
  } catch (e) {
    ElMessage.error('获取素材列表失败')
  } finally {
    bindLoading.value = false
  }
}

const onBindSizeChange = (val: number) => { bindPageSize.value = val; fetchBindList() }
const onBindPageChange = (val: number) => { bindPageNum.value = val; fetchBindList() }

const confirmBind = async (asset: IconAssetVO) => {
  if (!glyphId || !asset?.id) return
  bindLoading.value = true
  try {
    const resp = await bindAssetsToGlyph(glyphId, [asset.id])
    const data = (resp as any)?.data || []
    rows.value = data
    ElMessage.success('绑定成功')
    bindVisible.value = false
  } catch (e) {
    ElMessage.error('绑定失败')
  } finally {
    bindLoading.value = false
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
