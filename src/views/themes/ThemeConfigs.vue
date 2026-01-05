<template>
  <div class="theme-configs-page">
    <div class="header">
      <h2>主题配置</h2>
      <div class="tools">
        <AppSearchSelect v-model="qAppId" width="220px" />
        <el-input v-model="qKey" placeholder="key" clearable style="width: 160px" @keyup.enter.native="handleSearch" />
        <el-input v-model="qValue" placeholder="value" clearable style="width: 160px" @keyup.enter.native="handleSearch" />
        <el-select v-model="qActive" placeholder="是否启用" clearable style="width: 140px" @change="handleSearch">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="success" @click="openCreate">新增</el-button>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="fetchPage">刷新</el-button>
      </div>
    </div>

    <el-table :data="rows" v-loading="loading" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="应用" min-width="320">
        <template #default="{ row }">
          <AppProductInfo :product="row.product as any" :app-id="row.appId" :thumb-size="44" />
        </template>
      </el-table-column>
      <el-table-column prop="key" label="key" width="160" />
      <el-table-column prop="value" label="value" width="180" />
      <el-table-column label="图片" width="140">
        <template #default="{ row }">
          <ImagePreview :image="row.image" :height="60" />
        </template>
      </el-table-column>
      <el-table-column prop="weight" label="weight" width="100" />
      <el-table-column prop="priority" label="priority" width="110" />
      <el-table-column label="启用" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="row.active === 1 ? 'success' : 'info'">{{ row.active === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="openDetail(row)">查看</el-button>
          <el-button size="small" text type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" text type="danger" @click="confirmRemove(row.id)">删除</el-button>
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

    <el-dialog v-model="detailVisible" title="主题配置详情" width="760px">
      <template v-if="detail">
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="AppId">{{ detail.appId }}</el-descriptions-item>
          <el-descriptions-item label="key">{{ detail.key }}</el-descriptions-item>
          <el-descriptions-item label="value">{{ detail.value }}</el-descriptions-item>
          <el-descriptions-item label="imageId">{{ detail.imageId }}</el-descriptions-item>
          <el-descriptions-item label="图片">
            <ImagePreview :image="detail.image" :height="80" />
          </el-descriptions-item>
          <el-descriptions-item label="weight">{{ detail.weight }}</el-descriptions-item>
          <el-descriptions-item label="priority">{{ detail.priority }}</el-descriptions-item>
          <el-descriptions-item label="active">{{ detail.active }}</el-descriptions-item>
          <el-descriptions-item label="colorJson">
            <pre class="json-pre">{{ detail.colorJson || '' }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" :title="editForm.id ? '编辑主题配置' : '新增主题配置'" width="760px">
      <el-form ref="editFormRef" :model="editForm" :rules="rules" label-width="120px">
        <el-form-item label="AppId" prop="appId">
          <AppSearchSelect v-model="editForm.appId" width="100%" />
        </el-form-item>
        <el-form-item v-if="!editForm.id" label="ruleType" prop="_ruleType" >
          <el-select v-model="editForm._ruleType" placeholder="请选择" style="width: 100%" disabled>
            <el-option
              v-for="opt in ruleTypeOptions"
              :key="opt.value"
              :label="opt.description || opt.name || opt.value"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="key" prop="key" disabled>
          <el-input v-model="editForm.key" :disabled="!editForm.id && !!autoOutputKey" placeholder="date/season/weather/time_slot"  />
        </el-form-item>
        <el-form-item label="value" prop="value">
          <el-select v-if="!editForm.id && valueOptions.length" v-model="editForm.value" placeholder="请选择" style="width: 100%">
            <el-option v-for="v in valueOptions" :key="v" :label="v" :value="v" />
          </el-select>
          <el-input v-else v-model="editForm.value" placeholder="2025-12-29/winter/rainy/morning" />
        </el-form-item>
        <el-form-item label="imageId" prop="imageId">
          <ImageUpload v-model="editForm.imageId" :preview-url="editPreviewUrl" aspect-code="background" />
        </el-form-item>
        <el-form-item label="colorJson">
          <el-input v-model="editForm.colorJson" type="textarea" :rows="6" placeholder='{"primary":"#1E90FF","text":"#FFFFFF"}' />
        </el-form-item>
        <el-form-item label="weight" prop="weight">
          <el-input-number v-model="editForm.weight" :min="1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="priority" prop="priority">
          <el-input-number v-model="editForm.priority" :min="0" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="启用" prop="active">
          <el-switch v-model="editForm.active" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { ThemeConfigVO, ThemeConfigUpsertDTO, RuleConfigVO, ThemeRuleVO } from '@/types/themes'
import { pageThemeConfigs, getThemeConfigDetail, createThemeConfig, updateThemeConfig, deleteThemeConfig, getThemeRuleDetail, getThemeRuleTypeConfigByCode } from '@/api/themes'
import ImageUpload from '@/components/common/ImageUpload.vue'
import ImagePreview from '@/components/common/ImagePreview.vue'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import AppProductInfo from '@/components/common/AppProductInfo.vue'
import type { EnumOption } from '@/api/common'
import { useEnumStore } from '@/store/common'

const rows = ref<ThemeConfigVO[]>([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

const qAppId = ref<number | null>(null)
const qKey = ref<string>('')
const qValue = ref<string>('')
const qActive = ref<number | undefined>(undefined)

const detailVisible = ref(false)
const detail = ref<ThemeConfigVO | null>(null)

const editVisible = ref(false)
const editFormRef = ref()
const editPreviewUrl = ref<string>('')
const editForm = reactive<Omit<ThemeConfigUpsertDTO, 'appId'> & { id?: number; appId: number | null; _ruleType: string }>({
  id: undefined,
  appId: null,
  _ruleType: '',
  key: '',
  value: '',
  imageId: 0 as any,
  colorJson: '',
  weight: 1,
  priority: 0,
  active: 1
})

const rules = {
  appId: [{ required: true, message: '请填写 AppId', trigger: 'change' }],
  _ruleType: [
    {
      validator: (_: any, value: string, callback: any) => {
        if (editForm.id) {
          callback()
          return
        }
        if (!value) {
          callback(new Error('请选择 ruleType'))
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  key: [{ required: true, message: '请填写 key', trigger: 'blur' }],
  value: [{ required: true, message: '请填写 value', trigger: 'change' }],
  imageId: [{ required: true, message: '请选择图片', trigger: 'change' }]
}

const submitting = ref(false)

const THEME_RULE_TYPE_ENUM_NAME = 'com.wukong.face.modules.themes.enums.ThemeRuleTypeEnum'
const enumStore = useEnumStore()
const ruleTypeOptions = ref<EnumOption[]>([])

const autoOutputKey = ref<string>('')
const valueOptions = ref<string[]>([])
const loadingRuleTemplate = ref(false)
const initializingCreate = ref(false)

const loadRuleTemplate = async (ruleType: string) => {
  if (!ruleType) return
  if (loadingRuleTemplate.value) return

  loadingRuleTemplate.value = true
  try {
    const resp = (await getThemeRuleTypeConfigByCode(ruleType)) as any
    const data = (resp?.data?.data ?? resp?.data) as RuleConfigVO | undefined
    const key = data?.output?.key || ''
    const values = data?.output?.values || []

    autoOutputKey.value = key
    valueOptions.value = Array.isArray(values) ? values.filter(Boolean) : []

    if (key) {
      editForm.key = key
    }

    if (valueOptions.value.length) {
      const current = (editForm.value || '').trim()
      if (!current || !valueOptions.value.includes(current)) {
        editForm.value = valueOptions.value[0]
      }
    } else {
      editForm.value = ''
    }
  } catch {
    autoOutputKey.value = ''
    valueOptions.value = []
    ElMessage.error('获取规则模板失败')
  } finally {
    loadingRuleTemplate.value = false
  }
}

const fetchPage = async () => {
  loading.value = true
  try {
    const resp = (await pageThemeConfigs({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      appId: qAppId.value ?? undefined,
      key: qKey.value ? qKey.value.trim() : undefined,
      value: qValue.value ? qValue.value.trim() : undefined,
      active: qActive.value,
      orderBy: 'id:desc'
    } as any)) as unknown as ApiResponse<PageResponse<ThemeConfigVO>>

    rows.value = resp.data?.list || []
    total.value = resp.data?.total || 0
  } catch (e) {
    ElMessage.error('获取主题配置列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchPage()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchPage()
}

const handleCurrentChange = (val: number) => {
  pageNum.value = val
  fetchPage()
}

const openDetail = async (row: ThemeConfigVO) => {
  try {
    const resp = (await getThemeConfigDetail(row.id)) as unknown as ApiResponse<ThemeConfigVO>
    detail.value = resp.data || row
  } catch {
    detail.value = row
  }
  detailVisible.value = true
}

const openCreate = () => {
  initializingCreate.value = true
  editForm.id = undefined
  editForm.appId = null
  editForm._ruleType = ''
  editForm.key = ''
  editForm.value = ''
  editForm.imageId = 0 as any
  editForm.colorJson = ''
  editForm.weight = 1
  editForm.priority = 0
  editForm.active = 1
  editPreviewUrl.value = ''
  autoOutputKey.value = ''
  valueOptions.value = []
  editVisible.value = true
  initializingCreate.value = false
}

const openEdit = async (row: ThemeConfigVO) => {
  editForm.id = row.id
  editForm.appId = row.appId
  editForm.key = row.key
  editForm.value = row.value
  editForm.imageId = row.imageId
  editForm.colorJson = (row.colorJson as any) || ''
  editForm.weight = (row.weight as any) ?? 1
  editForm.priority = (row.priority as any) ?? 0
  editForm.active = row.active
  editPreviewUrl.value = row.image?.previewUrl || row.image?.url || ''

  try {
    const resp = (await getThemeConfigDetail(row.id)) as unknown as ApiResponse<ThemeConfigVO>
    if (resp.code === 0 && resp.data) {
      editForm.appId = resp.data.appId
      editForm.key = resp.data.key
      editForm.value = resp.data.value
      editForm.imageId = resp.data.imageId
      editForm.colorJson = (resp.data.colorJson as any) || ''
      editForm.weight = (resp.data.weight as any) ?? 1
      editForm.priority = (resp.data.priority as any) ?? 0
      editForm.active = resp.data.active
      editPreviewUrl.value = resp.data.image?.previewUrl || resp.data.image?.url || editPreviewUrl.value
    }
  } catch {
    // ignore
  }

  editVisible.value = true
}

const submitEdit = async () => {
  const formEl = editFormRef.value as any
  if (formEl) {
    const valid = await formEl.validate().catch(() => false)
    if (!valid) return
  }

  if (!editForm.appId) {
    ElMessage.error('请选择 AppId')
    return
  }

  if (editForm.colorJson && editForm.colorJson.trim()) {
    try {
      JSON.parse(editForm.colorJson)
    } catch {
      ElMessage.error('colorJson 不是合法 JSON')
      return
    }
  }

  submitting.value = true
  try {
    const dto: ThemeConfigUpsertDTO = {
      appId: Number(editForm.appId),
      key: editForm.key,
      value: editForm.value,
      imageId: Number(editForm.imageId),
      colorJson: editForm.colorJson ? editForm.colorJson : undefined,
      weight: editForm.weight,
      priority: editForm.priority,
      active: editForm.active
    }

    if (editForm.id) {
      await updateThemeConfig(editForm.id, dto)
    } else {
      await createThemeConfig(dto)
    }

    ElMessage.success('保存成功')
    editVisible.value = false
    fetchPage()
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

const confirmRemove = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认删除该主题配置？', '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  try {
    await deleteThemeConfig(id)
    ElMessage.success('删除成功')
    fetchPage()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchPage()
  enumStore
    .getEnumOptions(THEME_RULE_TYPE_ENUM_NAME)
    .then((list) => {
      ruleTypeOptions.value = list || []
    })
    .catch(() => {
      ruleTypeOptions.value = []
    })
})

watch(
  () => editForm._ruleType,
  (val, oldVal) => {
    if (!editVisible.value) return
    if (editForm.id) return
    if (initializingCreate.value) return
    if (!val || val === oldVal) return
    loadRuleTemplate(val)
  }
)

watch(
  () => editForm.appId,
  async (val, oldVal) => {
    if (!editVisible.value) return
    if (editForm.id) return
    if (initializingCreate.value) return
    if (!val || val === oldVal) return
    if (editForm._ruleType) return

    try {
      const resp = (await getThemeRuleDetail(Number(val))) as any
      const data = (resp?.data?.data ?? resp?.data) as ThemeRuleVO | undefined
      const rt = data?.ruleType
      if (rt) {
        editForm._ruleType = rt
      }
    } catch {
      // ignore
    }
  }
)

watch(
  qAppId,
  () => {
    handleSearch()
  },
  { flush: 'post' }
)
</script>

<style scoped>
.theme-configs-page { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.tools { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.json-pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
</style>
