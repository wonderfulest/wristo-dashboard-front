<template>
  <div class="page">
    <DataTypeOptionsSearch
      :query="query"
      :categories="categories"
      @update:query="val => Object.assign(query, val)"
      @search="handleSearch"
      @add="handleAdd"
    />

    <DataTypeOptionsList
      :list="list"
      :loading="loading"
      :total="total"
      :page-num="pageNum"
      :page-size="pageSize"
      :supported-langs="supportedLangs"
      @sort-change="handleSortChange"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      @edit="handleEdit"
      @delete="handleDelete"
      @refresh="loadData"
    />

    <DataTypeOptionDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :form="form"
      :categories="categories"
      @saved="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { DataTypeOptionVO, DataTypeOptionUpdateDTO, DataTypeOptionPageQueryDTO } from '@/types/data-type-option'
import { pageDataTypeOptions, removeDataTypeOption } from '@/api/data-type-options'
import DataTypeOptionDialog from './DataTypeOptionDialog.vue'
import DataTypeOptionsSearch from './DataTypeOptionsSearch.vue'
import DataTypeOptionsList from './DataTypeOptionsList.vue'

const categories = ['field', 'goal', 'chart', 'indicator', 'date']

// Supported language codes (aligned with backend LanguageCode enum)
const supportedLangs = [
  'ara','bul','ces','dan','deu','dut','eng','est',
  'fin','fre','gre','heb','hrv','hun','ind','ita',
  'jpn','kor','lav','lit','nob','pol','por','ron',
  'rus','slo','slv','spa','swe','tha','tur','ukr',
  'vie','zhs','zht','zsm'
]

const list = ref<DataTypeOptionVO[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(50)

const query = reactive<Partial<DataTypeOptionPageQueryDTO>>({ category: '', active: undefined, keyword: '', orderBy: 'id:asc' })

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')

const form = reactive<Partial<DataTypeOptionUpdateDTO> & { zhsLong?: string }>({
  id: undefined,
  metricSymbol: '',
  category: 'field',
  valueCode: 0,
  label: '',
  unit: '',
  iconUnicode: '',
  defaultValue: '',
  isActive: 1,
  sortOrder: 1,
  description: '',
  iconRules: undefined
})

const orderFieldMap: Record<string, string> = {
  valueCode: 'value_code',
  isActive: 'is_active',
  sortOrder: 'sort_order',
}

function loadData() {
  loading.value = true
  const dto: DataTypeOptionPageQueryDTO = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    category: query.category || undefined,
    active: typeof query.active === 'number' ? query.active : undefined,
    keyword: query.keyword || undefined,
    orderBy: (query as any).orderBy
  }
  pageDataTypeOptions(dto).then(res => {
    total.value = res.data?.total ?? 0
    list.value = res.data?.list ?? []
  }).finally(() => { loading.value = false })
}

function handleSearch() {
  pageNum.value = 1
  loadData()
}

function handleSizeChange(size: number) {
  pageSize.value = size
  loadData()
}

function handleCurrentChange(page: number) {
  pageNum.value = page
  loadData()
}

function handleSortChange(payload: { prop: string; order: 'ascending' | 'descending' | null }) {
  const { prop, order } = payload || ({} as any)
  if (!order || !prop) {
    ;(query as any).orderBy = 'id:asc'
  } else {
    const dir = order === 'ascending' ? 'asc' : 'desc'
    const backendField = orderFieldMap[prop] || prop
    ;(query as any).orderBy = `${backendField}:${dir},created_at:asc`
  }
  pageNum.value = 1
  loadData()
}

function handleAdd() {
  dialogType.value = 'add'
  Object.assign(form, {
    id: undefined,
    metricSymbol: '',
    category: 'field',
    valueCode: 0,
    label: '',
    unit: '',
    iconUnicode: '',
    defaultValue: '',
    isActive: 1,
    sortOrder: 1,
    description: '',
    zhsLong: '',
    iconRules: undefined
  })
  dialogVisible.value = true
}

function handleEdit(row: DataTypeOptionVO) {
  dialogType.value = 'edit'
  Object.assign(form, row)
  const i18n = (row as any).labelI18n || {}
  const zhs = i18n.zhs || {}
  form.zhsLong = zhs.long || form.zhsLong || ''
  dialogVisible.value = true
}

// saving handled by child dialog component

function handleDelete(row: DataTypeOptionVO) {
  ElMessageBox.confirm('Are you sure to delete this item?', 'Warning', { type: 'warning' })
    .then(async () => {
      await removeDataTypeOption(row.id)
      ElMessage.success('Deleted successfully')
      loadData()
    })
}

onMounted(loadData)
</script>

<style scoped>
.page { padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.filters { display: flex; gap: 12px; align-items: center; }
.pagination { margin-top: 16px; text-align: right; }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 24px; }
.form-grid .full { grid-column: 1 / -1; }
.i18n-summary { cursor: pointer; color: #409EFF; }
.i18n-editor { max-width: 100%; }
.i18n-table { width: 100%; border-collapse: collapse; }
.i18n-table th, .i18n-table td { border: 1px solid #eee; padding: 2px 6px; font-size: 12px; }
.i18n-table thead th { background: #fafafa; font-weight: 600; }
.i18n-table .lang { white-space: nowrap; color: #666; }
.i18n-table .text { word-break: break-word; }
.i18n-table .ops { text-align: center; }
.i18n-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
.add-lang { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.add-lang .hint { color: #999; font-size: 12px; }
</style>
