<template>
  <el-dialog v-model="visible" title="绑定字体素材" width="760px">
    <div class="bind-toolbar">
      <el-input v-model="keyword" placeholder="关键词 (assetCode/作者/标签)" clearable style="width: 260px" @keyup.enter.native="fetchList" />
      <el-button type="primary" @click="fetchList">搜索</el-button>
    </div>
    <el-table :data="rows" v-loading="loading" border height="380px">
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
          <el-button size="small" type="primary" @click="onSelect(row)">选择</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
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
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { pageIconAsset } from '@/api/icon-asset'
import type { IconAssetVO } from '@/types/icon-asset'

const props = defineProps<{
  modelValue: boolean
  iconId: number
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'select', asset: IconAssetVO): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const loading = ref(false)
const rows = ref<IconAssetVO[]>([])
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

watch(
  () => props.iconId,
  () => {
    if (visible.value) {
      pageNum.value = 1
      fetchList()
    }
  }
)

watch(
  () => visible.value,
  v => {
    if (v) {
      pageNum.value = 1
      fetchList()
    }
  }
)

const fetchList = async () => {
  if (!props.iconId) {
    ElMessage.warning('缺少 Icon 信息，无法查询素材')
    return
  }
  loading.value = true
  try {
    const resp = await pageIconAsset({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      iconId: props.iconId,
      keyword: keyword.value,
      orderBy: 'id:desc'
    } as any)
    const data = (resp as any)?.data
    rows.value = data?.list || []
    total.value = data?.total || 0
  } catch (e) {
    ElMessage.error('获取素材列表失败')
  } finally {
    loading.value = false
  }
}

const onSizeChange = (val: number) => { pageSize.value = val; fetchList() }
const onPageChange = (val: number) => { pageNum.value = val; fetchList() }

const onSelect = (asset: IconAssetVO) => {
  emit('select', asset)
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
</script>

<style scoped>
.bind-toolbar { display: flex; gap: 8px; margin-bottom: 10px; }
.muted { color: #909399; }
.pagination { margin-top: 12px; display: flex; justify-content: flex-end; }
</style>
