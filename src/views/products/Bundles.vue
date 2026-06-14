<template>
  <div class="bundles-page">
    <div class="header">
      <h2>Bundle 管理</h2>
      <div class="tools">
        <el-select v-model="qActive" placeholder="状态" clearable style="width: 140px" @change="handleSearch">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" @click="openCreate">新增 Bundle</el-button>
      </div>
    </div>

    <el-table :data="rows" v-loading="loading" border style="width: 100%">
      <el-table-column prop="bundleId" label="Bundle ID" width="150" />
      <el-table-column label="级别类型" width="120">
        <template #default="{ row }">
          <el-tag :type="bundleTypeTag(row.bundleType)">{{ bundleTypeLabel(row.bundleType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Bundle" min-width="260">
        <template #default="{ row }">
          <div class="main-text">{{ row.bundleName || '-' }}</div>
          <div class="sub-text ellipsis">{{ row.bundleDesc || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="设计师账户" min-width="240">
        <template #default="{ row }">
          <div class="main-text">{{ designerName(row) }}</div>
          <div class="sub-text">
            <span>{{ row.user?.email || '-' }}</span>
            <span class="dot">#{{ row.user?.id || row.userId || '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="价格" width="100">
        <template #default="{ row }">${{ formatCurrency(row.price) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="120" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.isActive"
            :active-value="1"
            :inactive-value="0"
            :loading="statusLoadingId === row.bundleId"
            inline-prompt
            active-text="启用"
            inactive-text="禁用"
            @change="handleActiveChange(row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column label="应用" min-width="360">
        <template #default="{ row }">
          <div v-if="row.products?.length" class="product-list">
            <AppProductInfo
              v-for="product in row.products.slice(0, 3)"
              :key="product.appId"
              :product="product"
              :thumb-size="36"
            />
            <span v-if="row.appCount && row.appCount > 3" class="sub-text">等 {{ row.appCount }} 个应用</span>
          </div>
          <span v-else class="sub-text">未配置应用</span>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="180">
        <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openDetail(row)">查看</el-button>
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
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

    <el-dialog v-model="detailVisible" title="Bundle 详情" width="860px">
      <template v-if="detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="Bundle ID">{{ detail.bundleId }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.isActive === 1 ? '启用' : '禁用' }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ bundleTypeLabel(detail.bundleType) }}</el-descriptions-item>
          <el-descriptions-item label="父级 Bundle">{{ detail.parentBundleId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ detail.bundleName }}</el-descriptions-item>
          <el-descriptions-item label="价格">${{ formatCurrency(detail.price) }}</el-descriptions-item>
          <el-descriptions-item label="设计师账户">
            {{ designerName(detail) }} / {{ detail.user?.email || '-' }} / #{{ detail.user?.id || detail.userId }}
          </el-descriptions-item>
          <el-descriptions-item label="包含应用">{{ detail.appCount ?? detail.products?.length ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            <div class="desc-text">{{ detail.bundleDesc || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="Paddle Product" :span="2">{{ detail.paddleProductId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Paddle Price" :span="2">{{ detail.paddlePriceId || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-products">
          <h3>包含应用</h3>
          <div v-if="detail.products?.length" class="detail-product-grid">
            <AppProductInfo
              v-for="product in detail.products"
              :key="product.appId"
              :product="product"
              :thumb-size="44"
            />
          </div>
          <div v-else class="sub-text">未配置应用</div>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" :title="editForm.bundleId ? '编辑 Bundle' : '新增 Bundle'" width="760px">
      <el-form ref="editFormRef" :model="editForm" :rules="rules" label-width="120px">
        <el-form-item label="设计师账户" prop="userId">
          <UserSelect
            v-model="editForm.userId"
            :role-authorities="['ROLE_DESIGNER']"
            placeholder="搜索设计师用户名或邮箱"
            style="width: 100%"
          />
          <div v-if="editingDesignerText" class="form-tip">当前：{{ editingDesignerText }}</div>
        </el-form-item>
        <el-form-item label="类型" prop="bundleType">
          <el-select v-model="editForm.bundleType" style="width: 100%" :disabled="editForm.bundleType === 'account'" @change="handleBundleTypeChange">
            <el-option label="自定义子 Bundle" value="custom" />
            <el-option label="账号级 Bundle" value="account" />
            <el-option label="全局 Bundle" value="global" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" prop="bundleName">
          <el-input v-model="editForm.bundleName" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="bundleDesc">
          <el-input v-model="editForm.bundleDesc" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="editForm.price" :min="5" :precision="2" :step="1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="包含应用" prop="appIds">
          <el-select
            v-model="editForm.appIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择应用"
            style="width: 100%"
            :loading="productsLoading"
            @change="productsDirty = true"
          >
            <el-option
              v-for="product in productOptions"
              :key="product.appId"
              :label="`${product.name || '-'} (#${product.appId})`"
              :value="product.appId"
            />
          </el-select>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import AppProductInfo from '@/components/common/AppProductInfo.vue'
import UserSelect from '@/components/users/UserSelect.vue'
import {
  createAdminBundle,
  fetchAdminBundlePage,
  getAdminBundle,
  updateAdminBundle,
  updateAdminBundleActive
} from '@/api/bundles'
import { fetchProductPage } from '@/api/products'
import type { Bundle } from '@/types/bundle'
import type { Product } from '@/types/product'
import { formatDateTime } from '@/utils/date'

const rows = ref<Bundle[]>([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const qActive = ref<number | undefined>(undefined)

const detailVisible = ref(false)
const detail = ref<Bundle | null>(null)

const editVisible = ref(false)
const editFormRef = ref<FormInstance>()
const submitting = ref(false)
const productsDirty = ref(false)
const productsLoading = ref(false)
const productOptions = ref<Product[]>([])
const statusLoadingId = ref<number | undefined>(undefined)
const editingDesignerText = ref('')
const ACCOUNT_BUNDLE_DEFAULT_PRICE = 9.9
const CUSTOM_BUNDLE_DEFAULT_PRICE = 5

const editForm = reactive({
  bundleId: undefined as number | undefined,
  userId: undefined as number | undefined,
  bundleType: 'custom',
  bundleName: '',
  bundleDesc: '',
  price: 5,
  appIds: [] as number[]
})

const rules = computed<FormRules>(() => ({
  userId: [{ required: true, message: '请选择设计师账户', trigger: 'change' }],
  bundleName: [{ required: true, message: '请输入 Bundle 名称', trigger: 'blur' }],
  bundleDesc: [{ required: true, message: '请输入 Bundle 描述', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'change' }],
  appIds: [{ required: !editForm.bundleId && editForm.bundleType === 'custom', message: '请选择应用', trigger: 'change' }]
}))

const designerName = (row: Bundle) => {
  return row.user?.nickname || row.user?.username || `用户 ${row.userId || '-'}`
}

const formatCurrency = (value?: number) => {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

const fetchPage = async () => {
  loading.value = true
  try {
    const res = await fetchAdminBundlePage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      isActive: qActive.value
    })
    rows.value = res.data?.list || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

const loadProducts = async () => {
  if (productOptions.value.length > 0 || productsLoading.value) return
  productsLoading.value = true
  try {
    const res = await fetchProductPage({
      pageNum: 1,
      pageSize: 1000,
      orderBy: 'created_at:desc'
    })
    productOptions.value = res.data?.list || []
  } finally {
    productsLoading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchPage()
}

const handleReset = () => {
  qActive.value = undefined
  pageNum.value = 1
  fetchPage()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchPage()
}

const handleCurrentChange = (page: number) => {
  pageNum.value = page
  fetchPage()
}

const resetForm = () => {
  editForm.bundleId = undefined
  editForm.userId = undefined
  editForm.bundleType = 'custom'
  editForm.bundleName = ''
  editForm.bundleDesc = ''
  editForm.price = CUSTOM_BUNDLE_DEFAULT_PRICE
  editForm.appIds = []
  editingDesignerText.value = ''
  productsDirty.value = false
  editFormRef.value?.clearValidate()
}

const fillForm = (bundle: Bundle) => {
  editForm.bundleId = bundle.bundleId
  editForm.userId = bundle.user?.id || bundle.userId
  editForm.bundleType = bundle.bundleType || 'custom'
  editForm.bundleName = bundle.bundleName || ''
  editForm.bundleDesc = bundle.bundleDesc || ''
  editForm.price = Number(bundle.price || defaultBundlePrice(editForm.bundleType))
  editForm.appIds = (bundle.products || []).map((product) => product.appId)
  editingDesignerText.value = `${designerName(bundle)} / ${bundle.user?.email || '-'} / #${bundle.user?.id || bundle.userId}`
  productsDirty.value = false
}

const openCreate = async () => {
  resetForm()
  editVisible.value = true
  await loadProducts()
}

const openEdit = async (row: Bundle) => {
  resetForm()
  editVisible.value = true
  await loadProducts()
  const res = await getAdminBundle(row.bundleId)
  if (res.data) fillForm(res.data)
}

const defaultBundlePrice = (bundleType?: string) => {
  return bundleType === 'account' ? ACCOUNT_BUNDLE_DEFAULT_PRICE : CUSTOM_BUNDLE_DEFAULT_PRICE
}

const handleBundleTypeChange = () => {
  if (!editForm.bundleId) {
    editForm.price = defaultBundlePrice(editForm.bundleType)
  }
}

const openDetail = async (row: Bundle) => {
  const res = await getAdminBundle(row.bundleId)
  detail.value = res.data || row
  detailVisible.value = true
}

const submitEdit = async () => {
  await editFormRef.value?.validate()
  submitting.value = true
  try {
    if (editForm.bundleId) {
      await updateAdminBundle(editForm.bundleId, {
        userId: editForm.userId,
        bundleType: editForm.bundleType,
        bundleName: editForm.bundleName.trim(),
        bundleDesc: editForm.bundleDesc.trim(),
        price: editForm.price,
        appIds: productsDirty.value ? editForm.appIds.slice() : undefined
      })
      ElMessage.success('Bundle 已更新')
    } else {
      await createAdminBundle({
        userId: editForm.userId,
        bundleType: editForm.bundleType,
        bundleName: editForm.bundleName.trim(),
        bundleDesc: editForm.bundleDesc.trim(),
        price: editForm.price,
        appIds: editForm.appIds.slice()
      })
      ElMessage.success('Bundle 已新增')
    }
    editVisible.value = false
    fetchPage()
  } finally {
    submitting.value = false
  }
}

const handleActiveChange = async (row: Bundle, value: string | number | boolean) => {
  const next = Number(value)
  const previous = row.isActive
  statusLoadingId.value = row.bundleId
  try {
    await updateAdminBundleActive(row.bundleId, next)
    row.isActive = next
    ElMessage.success(next === 1 ? 'Bundle 已启用' : 'Bundle 已禁用')
  } catch (error) {
    row.isActive = previous
    throw error
  } finally {
    statusLoadingId.value = undefined
  }
}

const bundleTypeLabel = (type?: string) => {
  if (type === 'account') return '账号级'
  if (type === 'global') return '全局'
  return '自定义'
}

const bundleTypeTag = (type?: string) => {
  if (type === 'account') return 'warning'
  if (type === 'global') return 'danger'
  return 'info'
}

onMounted(() => {
  fetchPage()
})
</script>

<style scoped lang="scss">
.bundles-page {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-text {
  font-weight: 600;
  color: #303133;
}

.sub-text {
  margin-top: 3px;
  font-size: 12px;
  color: #909399;
}

.dot {
  margin-left: 8px;
}

.ellipsis {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.desc-text {
  white-space: pre-wrap;
}

.detail-products {
  margin-top: 18px;
}

.detail-products h3 {
  margin: 0 0 12px;
  font-size: 15px;
}

.detail-product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}
</style>
