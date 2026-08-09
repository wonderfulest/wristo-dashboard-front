<template>
  <section>
    <div class="toolbar">
      <el-input v-model="query.keyword" clearable placeholder="Search units" @keyup.enter="search" />
      <el-select v-model="query.active" clearable placeholder="All states" @change="search">
        <el-option label="Active" :value="1" /><el-option label="Inactive" :value="0" />
      </el-select>
      <el-button type="primary" @click="openAdd">Add Unit</el-button>
    </div>
    <el-alert v-if="loadError" type="error" :closable="false" title="Units could not be loaded. Last good data is preserved.">
      <el-button link type="primary" :loading="loading" @click="loadData()">Retry</el-button>
    </el-alert>
    <el-table :data="list" v-loading="loading" row-key="id">
      <el-table-column prop="unitKey" label="Key" min-width="130" />
      <el-table-column prop="name" label="Name" min-width="140" />
      <el-table-column label="Default" min-width="100"><template #default="{ row }">{{ row.defaultVariant || 'none' }}</template></el-table-column>
      <el-table-column label="Variants" min-width="200"><template #default="{ row }">{{ Object.keys(row.variants).join(', ') || 'none' }}</template></el-table-column>
      <el-table-column prop="referenceCount" label="References" width="110" />
      <el-table-column label="Active" width="90">
        <template #default="{ row }">
          <el-switch
            :model-value="row.isActive === 1"
            :loading="activeLoadingIds.has(row.id)"
            :disabled="activeLoadingIds.has(row.id) || (row.referenceCount > 0 && row.isActive === 1)"
            @change="changeActiveInput(row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">Edit</el-button>
          <el-button link type="danger" :disabled="row.referenceCount > 0 || row.unitKey === 'none'" @click="remove(row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="pageNum"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      @size-change="loadData"
      @current-change="loadData"
    />
    <DataUnitDefinitionDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :form="form"
      :form-version="formVersion"
      @saved="loadData"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { DataUnitDefinitionPageQueryDTO, DataUnitDefinitionVO } from '@/types/data-unit-definition'
import { pageDataUnits, removeDataUnit, updateDataUnit } from '@/api/data-units'
import { createLatestRequestGate } from './dataCatalogForm.mjs'
import { cloneUnitForm, createEmptyUnitForm, replaceUnitForm } from './unitCatalogEditor.mjs'
import DataUnitDefinitionDialog from './DataUnitDefinitionDialog.vue'

const list = ref<DataUnitDefinitionVO[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const loadError = ref(false)
const activeLoadingIds = ref(new Set<number>())
const query = reactive<Partial<DataUnitDefinitionPageQueryDTO>>({ active: undefined, keyword: '' })
const requestGate = createLatestRequestGate()
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const form = reactive<any>(createEmptyUnitForm())
const formVersion = ref(0)

async function loadData() {
  const request = requestGate.begin()
  loading.value = true
  loadError.value = false
  try {
    const response = await pageDataUnits({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      active: typeof query.active === 'number' ? query.active : undefined,
      keyword: query.keyword?.trim() || undefined,
      orderBy: 'sort_order:asc,id:asc',
    })
    if (!requestGate.isLatest(request)) return
    list.value = response.data?.list ?? []
    total.value = response.data?.total ?? 0
  } catch {
    if (requestGate.isLatest(request)) loadError.value = true
  } finally {
    if (requestGate.isLatest(request)) loading.value = false
  }
}

function search() { pageNum.value = 1; void loadData() }
function resetForm(value: object = createEmptyUnitForm()) { replaceUnitForm(form, value); formVersion.value += 1 }
function openAdd() { dialogType.value = 'add'; resetForm(); dialogVisible.value = true }
function openEdit(row: DataUnitDefinitionVO) { dialogType.value = 'edit'; resetForm({ ...cloneUnitForm(row), referenceCount: row.referenceCount }); dialogVisible.value = true }

async function changeActive(row: DataUnitDefinitionVO, value: string | number | boolean) {
  const desired = value ? 1 : 0
  if (desired === 0 && row.referenceCount > 0) {
    ElMessage.warning('Referenced units cannot be disabled')
    return
  }
  setActiveLoading(row.id, true)
  try {
    await updateDataUnit(row.id, { isActive: desired })
    await loadData()
  } catch {
    ElMessage.error('Failed to update unit state')
  } finally {
    setActiveLoading(row.id, false)
  }
}

function changeActiveInput(row: DataUnitDefinitionVO, value: unknown) {
  void changeActive(row, Boolean(value))
}

function setActiveLoading(id: number, pending: boolean) {
  const next = new Set(activeLoadingIds.value)
  pending ? next.add(id) : next.delete(id)
  activeLoadingIds.value = next
}

async function remove(row: DataUnitDefinitionVO) {
  if (row.referenceCount > 0 || row.unitKey === 'none') {
    ElMessage.warning('Referenced units and none cannot be deleted')
    return
  }
  try {
    await ElMessageBox.confirm(`Delete unit ${row.unitKey}?`, 'Warning', { type: 'warning' })
    await removeDataUnit(row.id)
    ElMessage.success('Deleted successfully')
    await loadData()
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('Failed to delete unit')
  }
}

onMounted(loadData)
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.toolbar .el-input { width: 280px; }
.toolbar .el-select { width: 150px; }
.el-alert { margin-bottom: 12px; }
.el-pagination { justify-content: flex-end; margin-top: 16px; }
</style>
