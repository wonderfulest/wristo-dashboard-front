<template>
  <div class="page">
    <div class="header">
      <div class="filters">
        <el-select v-model="query.category" placeholder="类别" clearable style="width: 160px">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="query.dataType" placeholder="数据类型" clearable style="width: 160px">
          <el-option v-for="t in dataTypes" :key="t" :label="t" :value="t" />
        </el-select>
        <el-select v-model="query.isActive" placeholder="启用" clearable style="width: 120px">
          <el-option :value="1" label="启用" />
          <el-option :value="0" label="禁用" />
        </el-select>
        <el-input v-model="query.variableKeyLike" placeholder="变量键关键词" clearable style="width: 220px" />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button type="primary" @click="openAdd">新增</el-button>
      </div>
    </div>

    <el-table :data="list" style="width: 100%" v-loading="loading" border @sort-change="handleSortChange">
      <el-table-column prop="id" label="ID" width="80" sortable="custom" />
      <el-table-column prop="variableKey" label="变量键" min-width="160" sortable="custom" />
      <el-table-column prop="label" label="标签" min-width="160" />
      <el-table-column prop="category" label="类别" width="140" />
      <el-table-column prop="dataType" label="类型" width="120" />
      <el-table-column prop="sourceTable" label="来源表" width="160" />
      <el-table-column prop="sourceField" label="来源字段" width="160" />
      <el-table-column prop="joinKey" label="关联键" width="140" />
      <el-table-column prop="sampleValue" label="示例值" min-width="160" />
      <el-table-column prop="isActive" label="启用" width="100" sortable="custom">
        <template #default="{ row }">
          <el-tag :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="90" sortable="custom" />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="info" @click="openPreview(row)">预览上下文</el-button>
          <el-button link type="danger" @click="confirmDelete(row)">删除</el-button>
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

    <!-- 新增/编辑 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增模板变量' : '编辑模板变量'" width="780px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <div class="form-grid">
          <el-form-item label="变量键" prop="variableKey">
            <el-input v-model="form.variableKey" />
          </el-form-item>
          <el-form-item label="类别" prop="category">
            <el-select v-model="form.category" placeholder="类别">
              <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="数据类型" prop="dataType">
            <el-select v-model="form.dataType" placeholder="类型">
              <el-option v-for="t in dataTypes" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item label="来源表" prop="sourceTable">
            <el-input v-model="form.sourceTable" />
          </el-form-item>
          <el-form-item label="来源字段" prop="sourceField">
            <el-input v-model="form.sourceField" />
          </el-form-item>
          <el-form-item label="关联键" prop="joinKey">
            <el-input v-model="form.joinKey" />
          </el-form-item>
          <el-form-item label="标签" prop="label">
            <el-input v-model="form.label" />
          </el-form-item>
          <el-form-item label="描述" prop="description" class="full">
            <el-input type="textarea" :rows="2" v-model="form.description" />
          </el-form-item>
          <el-form-item label="示例值" prop="sampleValue">
            <el-input v-model="form.sampleValue" />
          </el-form-item>
          <el-form-item label="启用" prop="isActive">
            <el-switch v-model="switchActive" />
          </el-form-item>
          <el-form-item label="排序" prop="sortOrder">
            <el-input-number v-model="form.sortOrder" :min="0" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 预览上下文 -->
    <el-dialog v-model="previewVisible" title="预览变量上下文" width="640px">
      <el-form label-width="120px" style="margin-bottom: 12px">
        <el-form-item label="用户ID">
          <el-input-number v-model="previewDto.userId" :min="0" />
        </el-form-item>
        <el-form-item label="产品ID">
          <el-input-number v-model="previewDto.productId" :min="0" />
        </el-form-item>
        <el-button type="primary" :loading="previewLoading" @click="doPreview">生成上下文</el-button>
      </el-form>
      <el-input type="textarea" :rows="12" v-model="previewJson" readonly />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { TemplateVariableVO, TemplateVariableQueryDTO, TemplateVariableCreateDTO, TemplateVariableUpdateDTO, TemplateVariablePreviewContextDTO } from '@/types/template-variable'
import { pageTemplateVariables, createTemplateVariable, updateTemplateVariable, deleteTemplateVariable, previewTemplateVariableContext } from '@/api/template-variable'

const categories = ['system', 'designer', 'product', 'store']
const dataTypes = ['string', 'number', 'date', 'url', 'enum']

const list = ref<TemplateVariableVO[]>([])
const loading = ref(false)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)

const query = reactive<Partial<TemplateVariableQueryDTO>>({ category: '', dataType: '', isActive: undefined, variableKeyLike: '' })

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const form = reactive<Partial<TemplateVariableUpdateDTO>>({
  id: undefined,
  variableKey: '',
  category: 'system',
  sourceTable: '',
  sourceField: '',
  joinKey: '',
  label: '',
  description: '',
  sampleValue: '',
  dataType: 'string',
  isActive: 1,
  sortOrder: 1
})

const switchActive = ref(true)
watch(switchActive, v => { form.isActive = v ? 1 : 0 })
watch(() => form.isActive, v => { switchActive.value = (v ?? 1) === 1 }, { immediate: true })

const rules = {
  variableKey: [{ required: true, message: '变量键必填', trigger: 'blur' }],
  category: [{ required: true, message: '类别必选', trigger: 'change' }],
  sourceTable: [{ required: true, message: '来源表必填', trigger: 'blur' }],
  sourceField: [{ required: true, message: '来源字段必填', trigger: 'blur' }],
  label: [{ required: true, message: '标签必填', trigger: 'blur' }],
  dataType: [{ required: true, message: '类型必选', trigger: 'change' }]
}

const orderFieldMap: Record<string, string> = {
  id: 'id',
  variableKey: 'variable_key',
  isActive: 'is_active',
  sortOrder: 'sort_order'
}

function loadData() {
  loading.value = true
  const dto: TemplateVariableQueryDTO = {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    category: query.category || undefined,
    dataType: query.dataType || undefined,
    isActive: typeof query.isActive === 'number' ? query.isActive : undefined,
    variableKeyLike: query.variableKeyLike || undefined,
    orderBy: (query as any).orderBy
  }
  pageTemplateVariables(dto).then(res => {
    const data = (res as any).data || {}
    total.value = data.total ?? 0
    list.value = data.list ?? []
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
    ;(query as any).orderBy = `${backendField}:${dir},id:desc`
  }
  pageNum.value = 1
  loadData()
}

function openAdd() {
  dialogType.value = 'add'
  Object.assign(form, {
    id: undefined,
    variableKey: '',
    category: 'system',
    sourceTable: '',
    sourceField: '',
    joinKey: '',
    label: '',
    description: '',
    sampleValue: '',
    dataType: 'string',
    isActive: 1,
    sortOrder: 1
  })
  dialogVisible.value = true
}

function openEdit(row: TemplateVariableVO) {
  dialogType.value = 'edit'
  Object.assign(form, row)
  dialogVisible.value = true
}

function handleSave() {
  formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    if (dialogType.value === 'add') {
      await createTemplateVariable(form as TemplateVariableCreateDTO)
      ElMessage.success('已新增')
    } else {
      await updateTemplateVariable({ ...(form as any), id: Number(form.id) } as TemplateVariableUpdateDTO)
      ElMessage.success('已更新')
    }
    dialogVisible.value = false
    loadData()
  })
}

function confirmDelete(row: TemplateVariableVO) {
  ElMessageBox.confirm('确认删除该变量？', '提示', { type: 'warning' })
    .then(async () => {
      await deleteTemplateVariable(row.id)
      ElMessage.success('已删除')
      loadData()
    })
    .catch(() => {})
}

// 预览上下文
const previewVisible = ref(false)
const previewDto = reactive<TemplateVariablePreviewContextDTO>({ userId: undefined, productId: undefined })
const previewJson = ref('')
const previewLoading = ref(false)

function openPreview(_: TemplateVariableVO) {
  previewVisible.value = true
}

async function doPreview() {
  try {
    previewLoading.value = true
    const res = await previewTemplateVariableContext(previewDto)
    previewJson.value = JSON.stringify(res.data || {}, null, 2)
  } finally {
    previewLoading.value = false
  }
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
