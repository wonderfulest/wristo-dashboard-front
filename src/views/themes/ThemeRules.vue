<template>
  <div class="theme-rules-page">
    <div class="header">
      <h2>主题规则</h2>
      <div class="tools">
        <AppSearchSelect v-model="qAppId" width="220px" />
        <el-input
          v-model="qRuleType"
          placeholder="ruleType"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleSearch"
        />
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
      <el-table-column prop="ruleType" label="ruleType" width="160" />
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

    <el-dialog v-model="detailVisible" title="主题规则详情" width="720px">
      <template v-if="detail">
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
          <el-descriptions-item label="AppId">{{ detail.appId }}</el-descriptions-item>
          <el-descriptions-item label="ruleType">{{ detail.ruleType }}</el-descriptions-item>
          <el-descriptions-item label="active">{{ detail.active }}</el-descriptions-item>
          <el-descriptions-item label="ruleCalculation">
            <JsonEditor :model-value="detail.ruleCalculation" readonly :rows="10" label="ruleCalculation" show-preview />
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" :title="editForm.id ? '编辑主题规则' : '新增主题规则'" width="720px">
      <el-form ref="editFormRef" :model="editForm" :rules="rules" label-width="120px">
        <el-form-item label="App" prop="appId">
          <AppSearchSelect v-model="editForm.appId" :disabled="!!editForm.id" width="100%" />
        </el-form-item>
        <el-form-item label="ruleType" prop="ruleType">
          <el-select v-model="editForm.ruleType" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="opt in ruleTypeOptions"
              :key="opt.value"
              :label="opt.description || opt.name || opt.value"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="ruleCalculation" prop="ruleCalculation">
          <JsonEditor v-model="editForm.ruleCalculation" :rows="10" placeholder='{ "rule_type": "daily", ... }' />
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
import type { ThemeRuleVO, ThemeRuleUpsertDTO } from '@/types/themes'
import { pageThemeRules, getThemeRuleDetail, upsertThemeRule, updateThemeRule, deleteThemeRule, getThemeRuleTypeConfigByCode } from '@/api/themes'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import AppProductInfo from '@/components/common/AppProductInfo.vue'
import JsonEditor from '@/components/common/JsonEditor.vue'
import type { EnumOption } from '@/api/common'
import { useEnumStore } from '@/store/common'

const rows = ref<ThemeRuleVO[]>([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

const qAppId = ref<number | null>(null)
const qRuleType = ref<string>('')
const qActive = ref<number | undefined>(undefined)

const detailVisible = ref(false)
const detail = ref<ThemeRuleVO | null>(null)

const editVisible = ref(false)
const editFormRef = ref()
const editForm = reactive<Omit<ThemeRuleUpsertDTO, 'appId'> & { id?: number; appId: number | null }>({
  id: undefined,
  appId: null,
  ruleType: '',
  ruleCalculation: '',
  active: 1
})

const rules = {
  appId: [{ required: true, message: '请填写 AppId', trigger: 'change' }],
  ruleType: [{ required: true, message: '请填写 ruleType', trigger: 'change' }],
  ruleCalculation: [{ required: true, message: '请填写 ruleCalculation', trigger: 'blur' }]
}

const submitting = ref(false)

const THEME_RULE_TYPE_ENUM_NAME = 'com.wukong.face.modules.themes.enums.ThemeRuleTypeEnum'
const enumStore = useEnumStore()
const ruleTypeOptions = ref<EnumOption[]>([])
const loadingRuleTemplate = ref(false)
const initializingEdit = ref(false)

const fetchPage = async () => {
  loading.value = true
  try {
    const resp = (await pageThemeRules({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      appId: qAppId.value ?? undefined,
      ruleType: qRuleType.value ? qRuleType.value.trim() : undefined,
      active: qActive.value,
      orderBy: 'id:desc'
    } as any)) as unknown as ApiResponse<PageResponse<ThemeRuleVO>>

    rows.value = resp.data?.list || []
    total.value = resp.data?.total || 0
  } catch (e) {
    ElMessage.error('获取主题规则列表失败')
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

const openDetail = async (row: ThemeRuleVO) => {
  try {
    const resp = (await getThemeRuleDetail(row.appId)) as unknown as ApiResponse<ThemeRuleVO>
    detail.value = resp.data || row
  } catch {
    detail.value = row
  }
  detailVisible.value = true
}

const openCreate = () => {
  initializingEdit.value = true
  editForm.id = undefined
  editForm.appId = null
  editForm.ruleType = ''
  editForm.ruleCalculation = ''
  editForm.active = 1
  editVisible.value = true
  initializingEdit.value = false
}

const openEdit = async (row: ThemeRuleVO) => {
  initializingEdit.value = true
  editForm.id = row.id
  editForm.appId = row.appId
  editForm.ruleType = row.ruleType
  editForm.ruleCalculation = (row as any).ruleCalculation || ''
  editForm.active = row.active

  try {
    const resp = (await getThemeRuleDetail(row.appId)) as unknown as ApiResponse<ThemeRuleVO>
    if (resp.code === 0 && resp.data) {
      editForm.ruleType = resp.data.ruleType
      editForm.ruleCalculation = resp.data.ruleCalculation
      editForm.active = resp.data.active
    }
  } catch {
    // ignore
  }

  editVisible.value = true
  initializingEdit.value = false
}

const fillRuleTemplateByType = async (ruleType: string) => {
  if (!ruleType) return
  if (loadingRuleTemplate.value) return

  loadingRuleTemplate.value = true
  try {
    const resp = (await getThemeRuleTypeConfigByCode(ruleType)) as any
    const data = resp?.data?.data ?? resp?.data
    if (!data) return

    const nextJson = JSON.stringify(data, null, 2)
    const current = (editForm.ruleCalculation || '').trim()

    if (current && current !== nextJson.trim()) {
      try {
        await ElMessageBox.confirm('当前 ruleCalculation 已有内容，是否用模板覆盖？', '提示', {
          type: 'warning',
          confirmButtonText: '覆盖',
          cancelButtonText: '取消'
        })
      } catch {
        return
      }
    }

    editForm.ruleCalculation = nextJson
  } catch {
    ElMessage.error('获取规则模板失败')
  } finally {
    loadingRuleTemplate.value = false
  }
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

  try {
    JSON.parse(editForm.ruleCalculation)
  } catch {
    ElMessage.error('ruleCalculation 不是合法 JSON')
    return
  }

  submitting.value = true
  try {
    const dto: ThemeRuleUpsertDTO = {
      appId: Number(editForm.appId),
      ruleType: editForm.ruleType,
      ruleCalculation: editForm.ruleCalculation,
      active: editForm.active
    }

    if (editForm.id) {
      await updateThemeRule(editForm.id, dto)
    } else {
      await upsertThemeRule(dto)
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
    await ElMessageBox.confirm('确认删除该主题规则？', '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  try {
    await deleteThemeRule(id)
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
  () => editForm.ruleType,
  (val, oldVal) => {
    if (!editVisible.value) return
    if (initializingEdit.value) return
    if (!val || val === oldVal) return
    fillRuleTemplateByType(val)
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
.theme-rules-page { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.tools { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.json-pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
</style>
