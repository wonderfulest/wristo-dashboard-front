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

    <el-table :data="list" style="width: 100%" v-loading="loading" border @sort-change="handleSortChange">
      <el-table-column prop="valueCode" label="Code" width="60" sortable="custom" />
      <el-table-column prop="metricSymbol" label="Metric Symbol" min-width="320" />
      <el-table-column prop="category" label="Category" width="120" />
   
      <el-table-column prop="label" label="Label" min-width="140" :formatter="labelEnFormatter" />
      <el-table-column prop="labelI18n" label="Labels (i18n)" min-width="160">
        <template #default="{ row }">
          <el-popover placement="bottom-start" trigger="click" width="520" :persistent="true" @show="onI18nPopoverShow(row)">
            <template #reference>
              <span class="i18n-summary">{{ i18nSummary(row) }}</span>
            </template>
            <div class="i18n-editor">
              <table class="i18n-table">
                <thead>
                  <tr>
                    <th style="width: 30px;">Lang</th>
                    <th style="width: 120px;">Long</th>
                    <th style="width: 120px;">Medium</th>
                    <th style="width: 120px;">Short</th>
                    <th style="width: 56px;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="lang in orderedEditKeys(row.id)" :key="`${row.id}-${lang}`">
                    <td class="lang">{{ lang }}</td>
                    <td class="text">
                      <el-input :model-value="i18nEdit[row.id]?.[lang]?.long ?? ''" @update:model-value="onEditField(row.id, lang, 'long', $event)" placeholder="long" size="small" />
                    </td>
                    <td class="text">
                      <el-input :model-value="i18nEdit[row.id]?.[lang]?.medium ?? ''" @update:model-value="onEditField(row.id, lang, 'medium', $event)" placeholder="medium" size="small" />
                    </td>
                    <td class="text">
                      <el-input :model-value="i18nEdit[row.id]?.[lang]?.short ?? ''" @update:model-value="onEditField(row.id, lang, 'short', $event)" placeholder="short" size="small" />
                    </td>
                    <td class="ops">
                      <el-button link type="danger" size="small" @click="removeLang(row, lang)">Del</el-button>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="5">
                      <div class="add-lang">
                        <el-select v-model="newLangCode[row.id]" placeholder="select language" size="small" style="width: 220px;" :teleported="false" @change="onNewLangChange(row, $event)">
                          <el-option
                            v-for="code in supportedLangs"
                            :key="code"
                            :label="code"
                            :value="code"
                            :disabled="Boolean((i18nEdit[row.id] && i18nEdit[row.id][code]) || (row.labelI18n && row.labelI18n[code]))"
                          />
                        </el-select>
                        <el-button size="small" @click="addLang(row)">Add</el-button>
                        <span class="hint">Preferred order: eng, zhs, others</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="i18n-actions">
                <el-button size="small" type="primary" @click="saveI18n(row)">Save</el-button>
              </div>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="Unit" width="100" />
      <el-table-column prop="iconUnicode" label="Icon Unicode" min-width="160" />
      <el-table-column prop="defaultValue" label="Default" min-width="120" />
      <el-table-column prop="isActive" label="Active" width="100" sortable="custom">
        <template #default="{ row }">
          <el-tag :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? 'Yes' : 'No' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="Sort" width="90" sortable="custom" />
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
          <el-form-item label="Metric Symbol" prop="metricSymbol" class="full">
            <el-input v-model="form.metricSymbol" style="width: 300px" />
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
          <el-form-item label="Label (CN)" prop="zhsLong">
            <el-input v-model="form.zhsLong" />
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
const pageSize = ref(100)

const query = reactive<DataTypeOptionPageQueryDTO>({ category: '', active: undefined, keyword: '' })

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref()

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
  zhsLong: ''
})

const switchActive = ref(true)
watch(switchActive, v => { form.isActive = v ? 1 : 0 })
watch(() => form.isActive, v => { switchActive.value = (v ?? 1) === 1 }, { immediate: true })

const rules = {
  metricSymbol: [{ required: true, message: 'Metric symbol required', trigger: 'blur' }],
  category: [{ required: true, message: 'Category required', trigger: 'change' }],
  valueCode: [{ required: true, message: 'Value code required', trigger: 'change' }],
  label: [{ required: true, message: 'Label required', trigger: 'blur' }],
  zhsLong: [{ required: true, message: '中文标签必填', trigger: 'blur' }]
}

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
    orderBy: query.orderBy
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

function handleSortChange(payload: { column: any; prop: string; order: 'ascending' | 'descending' | null }) {
  const { prop, order } = payload || ({} as any)
  if (!order || !prop) {
    ;(query as any).orderBy = undefined
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
    zhsLong: ''
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

function handleSave() {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    if (dialogType.value === 'add') {
      const payload: DataTypeOptionCreateDTO = {
        metricSymbol: form.metricSymbol || '',
        category: form.category || 'field',
        valueCode: Number(form.valueCode ?? 0),
        label: form.label || '',
        labelI18n: {
          zhs: { long: form.zhsLong || '' }
        },
        unit: form.unit || '',
        iconUnicode: form.iconUnicode || '',
        defaultValue: form.defaultValue || '',
        isActive: typeof form.isActive === 'number' ? form.isActive : 1,
        sortOrder: Number(form.sortOrder ?? 1),
        description: form.description || ''
      }
      await createDataTypeOption(payload)
      ElMessage.success('Added successfully')
    } else {
      const payload: DataTypeOptionUpdateDTO = {
        id: Number(form.id),
        metricSymbol: form.metricSymbol || '',
        category: form.category || 'field',
        valueCode: Number(form.valueCode ?? 0),
        label: form.label || '',
        labelI18n: {
          zhs: { long: form.zhsLong || '' }
        },
        unit: form.unit || '',
        iconUnicode: form.iconUnicode || '',
        defaultValue: form.defaultValue || '',
        isActive: typeof form.isActive === 'number' ? form.isActive : 1,
        sortOrder: Number(form.sortOrder ?? 1),
        description: form.description || ''
      }
      await updateDataTypeOption(Number(form.id), payload)
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

// 英文 Label 展示优先使用 i18n.eng.long，其次回退到扁平 label
function labelEnFormatter(row: any) {
  const i18n = row?.labelI18n
  const eng = i18n?.eng
  return eng?.long || row.label || ''
}


// i18n 语言顺序（仅 keys）
function orderedLabelKeys(row: any): string[] {
  const obj = row?.labelI18n || {}
  const keys = Object.keys(obj)
  const ordered = [] as string[]
  if (keys.includes('eng')) ordered.push('eng')
  if (keys.includes('zhs')) ordered.push('zhs')
  const others = keys.filter(k => k !== 'eng' && k !== 'zhs').sort()
  return ordered.concat(others)
}

// 显示逗号分隔的语言代码（eng、zhs 优先）
function i18nSummary(row: any): string {
  const keys = orderedLabelKeys(row)
  return keys.join(', ')
}

// 编辑状态缓存与操作
import type { LabelI18nItem } from '@/types/data-type-option'
const i18nEdit = reactive<Record<number, Record<string, LabelI18nItem>>>({})
const newLangCode = reactive<Record<number, string>>({})

function onI18nPopoverShow(row: any) {
  const src = row?.labelI18n || {}
  const clone: Record<string, LabelI18nItem> = {}
  for (const k of Object.keys(src)) {
    clone[k] = { long: src[k].long || '', medium: src[k].medium || '', short: src[k].short || '' }
  }
  i18nEdit[row.id] = clone
  newLangCode[row.id] = ''
}

function onEditField(rowId: number, lang: string, key: 'long' | 'medium' | 'short', val: string) {
  if (!i18nEdit[rowId]) i18nEdit[rowId] = {}
  if (!i18nEdit[rowId][lang]) i18nEdit[rowId][lang] = { long: '', medium: '', short: '' }
  i18nEdit[rowId][lang][key] = val
}

// 当前编辑中的语言顺序（来自 i18nEdit 的 keys）：eng -> zhs -> 其他
function orderedEditKeys(rowId: number): string[] {
  const obj = i18nEdit[rowId] || {}
  const keys = Object.keys(obj)
  const ordered: string[] = []
  if (keys.includes('eng')) ordered.push('eng')
  if (keys.includes('zhs')) ordered.push('zhs')
  const others = keys.filter(k => k !== 'eng' && k !== 'zhs').sort()
  return ordered.concat(others)
}

// 选择语言时，立即初始化该语言一行供填写
function onNewLangSelect(row: any, code: string) {
  const id: number = Number(row.id)
  if (!code) return
  if (!i18nEdit[id]) i18nEdit[id] = {}
  if (!i18nEdit[id][code]) i18nEdit[id][code] = { long: '', medium: '', short: '' }
}

function onNewLangChange(row: any, val: string) {
  onNewLangSelect(row, val)
}

function addLang(row: any) {
  const code = (newLangCode[row.id] || '').trim()
  if (!code) return
  if (!i18nEdit[row.id]) i18nEdit[row.id] = {}
  if (!i18nEdit[row.id][code]) i18nEdit[row.id][code] = { long: '', medium: '', short: '' }
  newLangCode[row.id] = ''
}

function removeLang(row: any, lang: string) {
  if (i18nEdit[row.id] && i18nEdit[row.id][lang]) {
    delete i18nEdit[row.id][lang]
  }
}

async function saveI18n(row: any) {
  const payload = { labelI18n: i18nEdit[row.id] }
  await updateDataTypeOption(Number(row.id), payload)
  ElMessage.success('Updated labels')
  loadData()
}
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
