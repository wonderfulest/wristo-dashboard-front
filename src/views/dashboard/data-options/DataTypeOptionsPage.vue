<template>
  <div class="page">
    <DataTypeOptionsSearch
      :query="query"
      :categories="categories"
      :add-disabled="!catalogWritable"
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
      :active-loading-ids="activeLoadingIds"
      :catalog-writable="catalogWritable"
      @sort-change="handleSortChange"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      @edit="handleEdit"
      @delete="handleDelete"
      @active-change="handleActiveChange"
    />

    <el-alert v-if="unitsError" type="error" :closable="false" class="units-alert">
      <template #title>Units could not be loaded. Data items are read-only until units are available.</template>
      <el-button link type="primary" :loading="unitsLoading" @click="retryUnits">Retry units</el-button>
    </el-alert>

    <DataTypeOptionDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :form="form"
      :form-version="formVersion"
      :categories="categories"
      :units="selectableUnits"
      @saved="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { DataTypeOptionVO, DataTypeOptionPageQueryDTO } from '@/types/data-type-option'
import type { DataUnitDefinitionVO } from '@/types/data-unit-definition'
import { pageDataTypeOptions, removeDataTypeOption, updateDataTypeOption } from '@/api/data-type-options'
import { listDataUnits } from '@/api/data-units'
import DataTypeOptionDialog from './DataTypeOptionDialog.vue'
import DataTypeOptionsSearch from './DataTypeOptionsSearch.vue'
import DataTypeOptionsList from './DataTypeOptionsList.vue'
import { cloneDataTypeForm, createEmptyDataTypeForm, createLatestRequestGate } from './dataCatalogForm.mjs'
import { DATA_TYPE_CATEGORY_ENUM_NAME, useEnumStore } from '@/store/common'

const categories = ref<string[]>([])
const enumStore = useEnumStore()
const list = ref<DataTypeOptionVO[]>([])
const activeUnits = ref<DataUnitDefinitionVO[]>([])
const unitsLoading = ref(false)
const unitsError = ref(false)
const unitsUnavailable = computed(() => unitsLoading.value || unitsError.value || activeUnits.value.length === 0)
const catalogWritable = computed(() => !unitsUnavailable.value)
const referencedInactiveUnit = ref<DataUnitDefinitionVO | null>(null)
const selectableUnits = computed(() => {
  const units = [...activeUnits.value]
  if (referencedInactiveUnit.value && !units.some(unit => unit.unitKey === referencedInactiveUnit.value?.unitKey)) {
    units.push(referencedInactiveUnit.value)
  }
  return units
})
const loading = ref(false)
const activeLoadingIds = ref(new Set<number>())
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(50)
const query = reactive<Partial<DataTypeOptionPageQueryDTO>>({ category: '', active: undefined, keyword: '', orderBy: 'id:asc' })
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const form = reactive(createEmptyDataTypeForm())
const formVersion = ref(0)
const listRequestGate = createLatestRequestGate()
const editRequestGate = createLatestRequestGate()

const orderFieldMap: Record<string, string> = {
  valueCode: 'value_code',
  isActive: 'is_active',
  sortOrder: 'sort_order',
}

async function loadData() {
  const request = listRequestGate.begin()
  loading.value = true
  try {
    const res = await pageDataTypeOptions({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      category: query.category || undefined,
      active: typeof query.active === 'number' ? query.active : undefined,
      keyword: query.keyword || undefined,
      orderBy: query.orderBy,
    })
    if (listRequestGate.isLatest(request)) {
      total.value = res.data?.total ?? 0
      list.value = res.data?.list ?? []
    }
  } catch {
    // The shared HTTP interceptor reports the request failure; keep the last good page.
  } finally {
    if (listRequestGate.isLatest(request)) loading.value = false
  }
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
  if (!payload?.order || !payload.prop) {
    query.orderBy = 'id:asc'
  } else {
    const direction = payload.order === 'ascending' ? 'asc' : 'desc'
    query.orderBy = `${orderFieldMap[payload.prop] || payload.prop}:${direction},created_at:asc`
  }
  pageNum.value = 1
  loadData()
}

function resetForm(next = createEmptyDataTypeForm()) {
  Object.assign(form, next)
  formVersion.value += 1
}

function handleAdd() {
  if (!catalogWritable.value) return
  editRequestGate.invalidate()
  dialogType.value = 'add'
  referencedInactiveUnit.value = null
  resetForm()
  dialogVisible.value = true
}

async function handleEdit(row: DataTypeOptionVO) {
  if (!catalogWritable.value) return
  const request = editRequestGate.begin()
  const nextForm = cloneDataTypeForm(row)
  let inactiveUnit: DataUnitDefinitionVO | null = null
  try {
    if (!activeUnits.value.some(unit => unit.unitKey === row.unitKey)) {
      const response = await listDataUnits()
      inactiveUnit = response.data?.find(unit => unit.unitKey === row.unitKey) ?? null
      if (!inactiveUnit) {
        if (editRequestGate.isLatest(request)) {
          ElMessage.error(`Referenced unit ${row.unitKey} is unavailable.`)
        }
        return
      }
    }
  } catch {
    // The shared HTTP interceptor reports the lookup failure.
    return
  }
  if (!editRequestGate.isLatest(request)) return
  dialogType.value = 'edit'
  referencedInactiveUnit.value = inactiveUnit
  resetForm(nextForm)
  dialogVisible.value = true
}

async function handleActiveChange(row: DataTypeOptionVO, value: number) {
  if (!catalogWritable.value) return
  const id = Number(row.id)
  const previous = row.isActive
  setActiveLoading(id, true)
  row.isActive = value
  try {
    await updateDataTypeOption(id, { isActive: value })
    ElMessage.success(value === 1 ? 'Activated' : 'Deactivated')
  } catch {
    row.isActive = previous
    ElMessage.error('Failed to update active state')
  } finally {
    setActiveLoading(id, false)
  }
}

function setActiveLoading(id: number, pending: boolean) {
  const next = new Set(activeLoadingIds.value)
  pending ? next.add(id) : next.delete(id)
  activeLoadingIds.value = next
}

function handleDelete(row: DataTypeOptionVO) {
  if (!catalogWritable.value) return
  ElMessageBox.confirm('Are you sure to delete this item?', 'Warning', { type: 'warning' })
    .then(async () => {
      await removeDataTypeOption(row.id)
      ElMessage.success('Deleted successfully')
      loadData()
    })
}

async function loadCategories() {
  try {
    const options = await enumStore.getEnumOptions(DATA_TYPE_CATEGORY_ENUM_NAME)
    categories.value = Array.isArray(options)
      ? options.map((item: any) => item?.value).filter((value: any) => typeof value === 'string')
      : []
  } catch {
    categories.value = []
  }
}

async function loadActiveUnits() {
  unitsLoading.value = true
  unitsError.value = false
  try {
    const response = await listDataUnits(1)
    activeUnits.value = response.data ?? []
    unitsError.value = activeUnits.value.length === 0
  } catch {
    activeUnits.value = []
    unitsError.value = true
  } finally {
    unitsLoading.value = false
  }
}

function retryUnits() {
  void loadActiveUnits()
}

onMounted(() => {
  void loadData()
  void loadCategories()
  void loadActiveUnits()
})
</script>

<style scoped>
.page { padding: 24px; }
.units-alert { margin-bottom: 16px; }
</style>
