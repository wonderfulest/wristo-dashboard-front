<template>
  <div class="icon-assets-container">
    <div class="header">
      <h2>Icon 素材</h2>
      <div class="tools">
        <el-input v-model="keyword" placeholder="关键词 (assetCode/作者/标签)" clearable style="width: 240px" @keyup.enter.native="handleSearch" />
        <el-select v-model="active" placeholder="状态" clearable style="width: 140px" @change="handleSearch">
          <el-option label="全部" :value="undefined" />
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-input-number v-model="iconId" :min="1" placeholder="IconID" controls-position="right" @change="handleSearch" />
        <el-select v-model="sortOrder" placeholder="排序" style="width: 200px" @change="handleSearch">
          <el-option label="创建时间倒序" value="created_at desc" />
          <el-option label="创建时间升序" value="created_at asc" />
          <el-option label="ID倒序" value="id desc" />
          <el-option label="ID升序" value="id asc" />
        </el-select>
        <el-input v-model="symbolCode" placeholder="symbolCode(可选)" clearable style="width: 200px" />
        <UploadSvg :symbol-code="symbolCode" @uploaded="fetchPage" />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="fetchPage">刷新</el-button>
      </div>
    </div>

    <div class="asset-grid" v-loading="loading">
      <div class="asset-card" v-for="row in assets" :key="row.id">
        <div class="thumb">
          <el-image
            v-if="row.previewUrl || row.imageUrl"
            :src="getPreviewUrl(row.previewUrl || row.imageUrl)"
            fit="contain"
            class="thumb-img"
          />
          <div v-else class="thumb-empty">-</div>
        </div>
        <div class="meta">
          <div class="sub">{{ iconLabelMap[row.iconId] || '-' }}</div>
        </div>
        <div class="overlay">
          <el-button size="small" text type="primary" @click="openUrl(row.imageUrl || row.previewUrl)" :disabled="!(row.imageUrl || row.previewUrl)">打开</el-button>
          <el-button size="small" text type="primary" @click="openEditMeta(row)">编辑</el-button>
          <el-button size="small" text type="primary" @click="openEdit(row)">编辑 SVG</el-button>
          <el-button size="small" text type="danger" @click="confirmRemove(row.id)">删除</el-button>
        </div>
      </div>
      <div v-if="!loading && assets.length === 0" class="empty">暂无数据</div>
    </div>

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
    
    <SvgEditor v-model="editVisible" :asset-id="editingId" @saved="onEdited" />
    <IconAssetEditDialog v-model="editMetaVisible" :asset-id="editingMetaId" @saved="onEdited" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { IconAssetVO } from '@/types/icon-asset'
import { pageIconAsset, removeIconAsset } from '@/api/icon-asset'
import { useIconStore } from '@/store/icon'
import IconAssetEditDialog from '@/views/icons/components/IconAssetEditDialog.vue'
import SvgEditor from '@/views/icons/components/SvgEditor.vue'
import UploadSvg from '@/views/icons/components/UploadSvg.vue'

const assets = ref<IconAssetVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(100)
const total = ref(0)
const iconStore = useIconStore()
const iconLabelMap = computed<Record<number, string>>(() => iconStore.idLabelMap)

const iconId = ref<number | undefined>(undefined)
const active = ref<number | undefined>(undefined)
const keyword = ref<string | undefined>(undefined)
const sortOrder = ref('created_at:desc')
const symbolCode = ref<string | undefined>(undefined)
const editVisible = ref(false)
const editingId = ref<number | null>(null)
const editMetaVisible = ref(false)
const editingMetaId = ref<number | null>(null)



const fetchPage = async () => {
  loading.value = true
  try {
    const resp = (await pageIconAsset({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      orderBy: sortOrder.value,
      iconId: iconId.value,
      active: active.value,
      keyword: keyword.value
    })) as unknown as ApiResponse<PageResponse<IconAssetVO>>
    assets.value = resp.data?.list || []
    total.value = resp.data?.total || 0
  } catch (e) {
    ElMessage.error('获取Icon素材列表失败')
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

const openUrl = (url?: string) => {
  if (!url) return
  window.open(url, '_blank')
}
// removed copyUrl; button now opens edit dialog

const getPreviewUrl = (url?: string) => {
  if (!url) return ''
  // Keep SVG as-is
  const lower = url.toLowerCase()
  if (lower.endsWith('.svg') || lower.includes('.svg?')) return url
  // Split query string if exists
  const [base, query] = url.split('?')
  const lastDot = base.lastIndexOf('.')
  if (lastDot === -1) return url
  const prefix = base.substring(0, lastDot)
  const ext = base.substring(lastDot)
  const withSize = `${prefix}_128x128${ext}`
  return query ? `${withSize}?${query}` : withSize
}

onMounted(async () => {
  fetchPage()
  await iconStore.ensureLoaded()
})

const confirmRemove = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认删除该素材？', '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    await removeIconAsset(id)
    ElMessage.success('删除成功')
    fetchPage()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const openEdit = (row: IconAssetVO) => {
  editingId.value = row.id
  editVisible.value = true
}

const openEditMeta = (row: IconAssetVO) => {
  editingMetaId.value = row.id
  editMetaVisible.value = true
}


const onEdited = () => {
  editVisible.value = false
  fetchPage()
}
</script>

<style scoped>
.icon-assets-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.tools { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.ops { display: flex; gap: 8px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }

/* Grid */
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 24px;
  padding: 8px 0;
}

.asset-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 16px 12px;
  transition: box-shadow .2s ease, transform .2s ease;
}

.asset-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.thumb {
  position: relative;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.thumb-img {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.02);
}

.thumb-empty {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  border-radius: 8px;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(17, 21, 42, 0.68);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* right side */
  justify-content: flex-start; /* from top to bottom */
  gap: 8px;
  padding: 12px;
  box-sizing: border-box;
  opacity: 0;
  transition: opacity .2s ease;
  z-index: 3;
  pointer-events: none;
}

.overlay .el-button { width: auto; }

.asset-card:hover .overlay { opacity: 1; pointer-events: auto; }

/* Edge highlight + blink on hover */
.asset-card:hover .thumb-img,
.thumb:hover .thumb-img {
  animation: edge-blink 1s linear infinite;
  box-shadow: 0 0 0 2px #66ccff, 0 0 12px rgba(102, 204, 255, 0.6);
}

@keyframes edge-blink {
  0%, 100% {
    box-shadow: 0 0 0 2px #66ccff, 0 0 8px rgba(102, 204, 255, 0.45);
  }
  50% {
    box-shadow: 0 0 0 2px #3aa9ff, 0 0 16px rgba(58, 169, 255, 0.85);
  }
}

.meta { text-align: center; width: 100%; }
.name { font-size: 14px; color: #2c3e50; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub { font-size: 12px; color: #909399; margin-top: 4px; }

/* editor styles moved inside SvgEditor */
</style>
