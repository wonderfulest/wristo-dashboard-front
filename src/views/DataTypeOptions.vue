<template>
  <div class="page">
    <div class="header">
      <div class="filters">
        <el-select v-model="query.category" placeholder="Category" clearable style="width: 160px">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="query.active" placeholder="Active" clearable style="width: 120px">
          <el-option :value="1" label="Active" />
          <el-option :value="0" label="Inactive" />
        </el-select>
        <el-input v-model="query.keyword" placeholder="Keyword (label/标签/metric)" clearable style="width: 220px" />
        <el-button type="primary" @click="handleSearch">Search</el-button>
        <el-button type="primary" @click="handleAdd">Add</el-button>
      </div>
    </div>

    <el-table :data="list" style="width: 100%" v-loading="loading" border>
      <el-table-column prop="valueCode" label="Code" width="60" />
      <el-table-column prop="metricSymbol" label="Metric Symbol" min-width="160" />
      <el-table-column prop="category" label="Category" width="120" />
   
      <el-table-column prop="label" label="Label" min-width="140" />
      <el-table-column prop="labelCn" label="标签(中文)" min-width="140" />
      <el-table-column prop="unit" label="Unit" width="100" />
      <el-table-column prop="iconUnicode" label="Icon Unicode" min-width="160" />
      <el-table-column prop="defaultValue" label="Default" min-width="120" />
      <el-table-column prop="isActive" label="Active" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? 'Yes' : 'No' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="Sort" width="90" />
      <el-table-column label="Action" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">Edit</el-button>
          <el-button type="danger" link @click="handleDelete(row)">Delete</el-button>
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
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? 'Add Data Type Option' : 'Edit Data Type Option'" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
        <div class="form-grid">
          <el-form-item label="Metric Symbol" prop="metricSymbol">
            <el-input v-model="form.metricSymbol" />
          </el-form-item>
          <el-form-item label="Category" prop="category">
            <el-select v-model="form.category" placeholder="Category">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="Value Code" prop="valueCode">
            <el-input-number v-model="form.valueCode" :min="0" />
          </el-form-item>
          <el-form-item label="Label (EN)" prop="label">
            <el-input v-model="form.label" />
          </el-form-item>
          <el-form-item label="Label (CN)" prop="labelCn">
            <el-input v-model="form.labelCn" />
          </el-form-item>
          <el-form-item label="Unit" prop="unit">
            <el-input v-model="form.unit" />
          </el-form-item>
          <el-form-item label="Icon Unicode" prop="iconUnicode">
            <el-input v-model="form.iconUnicode" />
          </el-form-item>
          <el-form-item label="Default Value" prop="defaultValue">
            <el-input v-model="form.defaultValue" />
          </el-form-item>
          <el-form-item label="EN Short" prop="enLabelShort">
            <el-input v-model="form.enLabelShort" />
          </el-form-item>
          <el-form-item label="EN Medium" prop="enLabelMedium">
            <el-input v-model="form.enLabelMedium" />
          </el-form-item>
          <el-form-item label="EN Long" prop="enLabelLong">
            <el-input v-model="form.enLabelLong" />
          </el-form-item>
          <el-form-item label="Active" prop="isActive">
            <el-switch v-model="switchActive" />
          </el-form-item>
          <el-form-item label="Sort Order" prop="sortOrder">
            <el-input-number v-model="form.sortOrder" :min="0" />
          </el-form-item>
          <el-form-item label="Description" prop="description" class="full">
            <el-input type="textarea" v-model="form.description" :rows="3" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSave">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { DataTypeOptionVO, DataTypeOptionCreateDTO, DataTypeOptionUpdateDTO, DataTypeOptionPageQueryDTO } from '@/types/data-type-option'
import { pageDataTypeOptions, createDataTypeOption, updateDataTypeOption, removeDataTypeOption } from '@/api/data-type-options'

const categories = ['field', 'goal', 'chart', 'indicator', 'date']

const list = ref<DataTypeOptionVO[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const query = reactive<DataTypeOptionPageQueryDTO>({ category: '', active: undefined, keyword: '' })

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref()

const form = reactive<Partial<DataTypeOptionUpdateDTO>>({
  id: undefined,
  metricSymbol: '',
  category: 'field',
  valueCode: 0,
  label: '',
  labelCn: '',
  unit: '',
  iconUnicode: '',
  defaultValue: '',
  enLabelShort: '',
  enLabelMedium: '',
  enLabelLong: '',
  isActive: 1,
  sortOrder: 1,
  description: ''
})

const switchActive = ref(true)
watch(switchActive, v => { form.isActive = v ? 1 : 0 })
watch(() => form.isActive, v => { switchActive.value = (v ?? 1) === 1 }, { immediate: true })

const rules = {
  metricSymbol: [{ required: true, message: 'Metric symbol required', trigger: 'blur' }],
  category: [{ required: true, message: 'Category required', trigger: 'change' }],
  valueCode: [{ required: true, message: 'Value code required', trigger: 'change' }],
  label: [{ required: true, message: 'Label required', trigger: 'blur' }],
  labelCn: [{ required: true, message: '中文标签必填', trigger: 'blur' }]
}

function loadData() {
  loading.value = true
  const dto: DataTypeOptionPageQueryDTO = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    category: query.category || undefined,
    active: typeof query.active === 'number' ? query.active : undefined,
    keyword: query.keyword || undefined
  }
  pageDataTypeOptions(dto).then(res => {
    total.value = res.data.total
    list.value = res.data.list
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

function handleAdd() {
  dialogType.value = 'add'
  Object.assign(form, {
    id: undefined,
    metricSymbol: '',
    category: 'field',
    valueCode: 0,
    label: '',
    labelCn: '',
    unit: '',
    iconUnicode: '',
    defaultValue: '',
    enLabelShort: '',
    enLabelMedium: '',
    enLabelLong: '',
    isActive: 1,
    sortOrder: 1,
    description: ''
  })
  dialogVisible.value = true
}

function handleEdit(row: DataTypeOptionVO) {
  dialogType.value = 'edit'
  Object.assign(form, row)
  dialogVisible.value = true
}

function handleSave() {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    if (dialogType.value === 'add') {
      const payload: DataTypeOptionCreateDTO = {
        metricSymbol: form.metricSymbol || '',
        category: form.category || 'field',
        valueCode: Number(form.valueCode ?? 0),
        label: form.label || '',
        labelCn: form.labelCn || '',
        unit: form.unit || '',
        iconUnicode: form.iconUnicode || '',
        defaultValue: form.defaultValue || '',
        enLabelShort: form.enLabelShort || '',
        enLabelMedium: form.enLabelMedium || '',
        enLabelLong: form.enLabelLong || '',
        isActive: typeof form.isActive === 'number' ? form.isActive : 1,
        sortOrder: Number(form.sortOrder ?? 1),
        description: form.description || ''
      }
      await createDataTypeOption(payload)
      ElMessage.success('Added successfully')
    } else {
      await updateDataTypeOption(Number(form.id), form as DataTypeOptionUpdateDTO)
      ElMessage.success('Updated successfully')
    }
    dialogVisible.value = false
    loadData()
  })
}

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
</style>
