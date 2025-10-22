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
        <el-input v-model="query.keyword" placeholder="Keyword (label/symbol)" clearable style="width: 220px" />
        <el-button type="primary" @click="handleSearch">Search</el-button>
        <el-button type="primary" @click="handleAdd">Add</el-button>
      </div>
    </div>

    <el-table :data="list" style="width: 100%" v-loading="loading" border @sort-change="handleSortChange">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="iconUnicode" label="Icon Unicode" min-width="160" />
      <el-table-column prop="symbolCode" label="Symbol Code" min-width="160" />
      <el-table-column prop="category" label="Category" width="140" />
      <el-table-column prop="label" label="Label" min-width="160" />
      <el-table-column prop="isActive" label="Active" width="100" sortable="custom">
        <template #default="{ row }">
          <el-tag :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? 'Yes' : 'No' }}</el-tag>
        </template>
      </el-table-column>
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

    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? 'Add Icon' : 'Edit Icon'" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
        <div class="form-grid">
          <el-form-item label="Icon Unicode" prop="iconUnicode">
            <el-input v-model="form.iconUnicode" />
          </el-form-item>
          <el-form-item label="Symbol Code" prop="symbolCode">
            <el-input v-model="form.symbolCode" />
          </el-form-item>
          <el-form-item label="Category" prop="category">
            <el-select v-model="form.category" placeholder="Category">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="Label" prop="label">
            <el-input v-model="form.label" />
          </el-form-item>
          <el-form-item label="Active" prop="isActive">
            <el-switch v-model="switchActive" />
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
import type { IconLibraryVO, IconLibraryCreateDTO, IconLibraryUpdateDTO, IconLibraryPageQueryDTO } from '@/types/icon-library'
import { pageIconLibrary, createIconLibrary, updateIconLibrary, removeIconLibrary } from '@/api/icon-library'

const categories = ['general', 'health', 'sports', 'weather']

const list = ref<IconLibraryVO[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(100)

const query = reactive<IconLibraryPageQueryDTO>({ category: '', active: undefined, keyword: '' })

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref()

const form = reactive<Partial<IconLibraryUpdateDTO>>({
  id: undefined,
  iconUnicode: '',
  symbolCode: '',
  category: 'general',
  label: '',
  isActive: 1
})

const switchActive = ref(true)
watch(switchActive, v => { form.isActive = v ? 1 : 0 })
watch(() => form.isActive, v => { switchActive.value = (v ?? 1) === 1 }, { immediate: true })

const rules = {
  iconUnicode: [{ required: true, message: 'Icon unicode required', trigger: 'blur' }],
  symbolCode: [{ required: true, message: 'Symbol code required', trigger: 'blur' }],
  category: [{ required: true, message: 'Category required', trigger: 'change' }],
  label: [{ required: true, message: 'Label required', trigger: 'blur' }]
}

function loadData() {
  loading.value = true
  const dto: IconLibraryPageQueryDTO = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    category: query.category || undefined,
    active: typeof query.active === 'number' ? query.active : undefined,
    keyword: query.keyword || undefined,
    orderBy: query.orderBy
  }
  pageIconLibrary(dto).then(res => {
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

function handleSortChange() {
  // simple table currently only sorts by isActive if needed; leave for future
}

function handleAdd() {
  dialogType.value = 'add'
  Object.assign(form, {
    id: undefined,
    iconUnicode: '',
    symbolCode: '',
    category: 'general',
    label: '',
    isActive: 1
  })
  dialogVisible.value = true
}

function handleEdit(row: IconLibraryVO) {
  dialogType.value = 'edit'
  Object.assign(form, row)
  dialogVisible.value = true
}

function handleSave() {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    if (dialogType.value === 'add') {
      const payload: IconLibraryCreateDTO = {
        iconUnicode: form.iconUnicode || '',
        symbolCode: form.symbolCode || '',
        category: form.category || 'general',
        label: form.label || '',
        isActive: typeof form.isActive === 'number' ? form.isActive : 1
      }
      await createIconLibrary(payload)
      ElMessage.success('Added successfully')
    } else {
      const payload: IconLibraryUpdateDTO = {
        id: Number(form.id),
        iconUnicode: form.iconUnicode || '',
        symbolCode: form.symbolCode || '',
        category: form.category || 'general',
        label: form.label || '',
        isActive: typeof form.isActive === 'number' ? form.isActive : 1
      }
      await updateIconLibrary(Number(form.id), payload)
      ElMessage.success('Updated successfully')
    }
    dialogVisible.value = false
    loadData()
  })
}

function handleDelete(row: IconLibraryVO) {
  ElMessageBox.confirm('Are you sure to delete this item?', 'Warning', { type: 'warning' })
    .then(async () => {
      await removeIconLibrary(row.id as unknown as number)
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
