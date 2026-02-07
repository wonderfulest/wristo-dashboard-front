<template>
  <div class="promoter-coupons-container">
    <div class="header">
      <h2>推广口令管理</h2>

      <div class="filters">
        <el-input
          v-model="couponCodeLike"
          placeholder="口令（支持模糊匹配）"
          clearable
          style="width: 220px"
          @keyup.enter.native="handleSearch"
        />
        <el-input
          v-model="promoterIdInput"
          placeholder="推广员 ID"
          clearable
          style="width: 160px"
          @keyup.enter.native="handleSearch"
        />
        <el-select v-model="status" placeholder="状态" clearable style="width: 160px" @change="handleSearch">
          <el-option label="全部" :value="undefined" />
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" @click="openCreateDialog">新建口令</el-button>
      </div>
    </div>

    <el-table :data="pageData.list" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="100" />
      <el-table-column prop="couponCode" label="口令" min-width="200" show-overflow-tooltip />
      <el-table-column prop="promoterId" label="推广员ID" width="120" />
      <el-table-column prop="discountType" label="折扣类型" width="120" />
      <el-table-column prop="discountValue" label="折扣值" width="120" />
      <el-table-column prop="commissionRate" label="佣金比例" width="120" />
      <el-table-column prop="maxUse" label="最大使用次数" width="140" />
      <el-table-column prop="usedCount" label="已使用次数" width="120" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">{{ row.status === 1 ? '启用' : row.status === 0 ? '禁用' : '-' }}</template>
      </el-table-column>
      <el-table-column prop="expireAt" label="到期时间" width="180">
        <template #default="{ row }">{{ fmtDate(row.expireAt) }}</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="180">
        <template #default="{ row }">{{ fmtDate(row.updatedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEditDialog(row.id)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="pageData.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="editDialogVisible" :title="isCreate ? '新建推广口令' : '编辑推广口令'" width="800px">
      <div v-loading="editLoading">
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="口令" required>
            <el-input v-model="editForm.couponCode" placeholder="输入或生成推广口令">
              <template #append>
                <el-input-number
                  v-model="generateLength"
                  :min="2"
                  :max="16"
                  :step="1"
                  size="small"
                  controls-position="right"
                  style="width: 90px; margin-right: 4px"
                />
                <el-button
                  type="primary"
                  size="small"
                  :loading="generateLoading"
                  @click.stop="handleGenerateCode"
                >
                  随机
                </el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="editForm.description" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="推广员ID" required>
            <UserSelect v-model="editForm.promoterId" placeholder="搜索用户作为推广员" />
          </el-form-item>
          <el-form-item label="折扣类型" required>
            <el-select v-model="editForm.discountType" placeholder="折扣类型" disabled style="width: 200px">
              <el-option
                v-for="opt in discountTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="折扣值" required>
            <el-input-number
              v-model="editForm.discountValue"
              :min="0"
              :step="0.01"
              style="width: 200px"
              disabled
            />
            <span style="margin-left: 8px">%</span>
          </el-form-item>
          <el-form-item label="佣金比例" required>
            <el-input-number
              v-model="editForm.commissionRate"
              :min="0"
              :max="1"
              :step="0.01"
              style="width: 200px"
              disabled
            />
            <span style="margin-left: 8px">（0.3 = 30%）</span>
          </el-form-item>
          <el-form-item label="最大使用次数">
            <el-input-number v-model="editForm.maxUse" :min="1" :step="1" style="width: 200px" />
          </el-form-item>
         
          <el-form-item label="Paddle 折扣ID">
            <el-input disabled v-model="editForm.paddleDiscountId" />
          </el-form-item>
          <el-form-item label="到期时间">
            <el-date-picker
              v-model="editForm.expireAt"
              type="datetime"
              placeholder="请选择到期时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DDTHH:mm:ss"
              style="width: 260px"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="editForm.status" placeholder="请选择">
              <el-option label="启用" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { PageResponse } from '@/types/api'
import type {
  PromoterCouponVO,
  PromoterCouponQueryDTO,
  PromoterCouponCreateDTO,
  PromoterCouponUpdateDTO,
} from '@/types/promoter-coupon'
import {
  fetchPromoterCouponPage,
  getPromoterCouponById,
  createPromoterCoupon,
  updatePromoterCoupon,
  deletePromoterCoupon,
  generateCouponCode,
} from '@/api/promoter-coupon'
import UserSelect from '@/components/users/UserSelect.vue'

const loading = ref(false)

const couponCodeLike = ref('')
const promoterIdInput = ref('')
const status = ref<number | undefined>(undefined)

const currentPage = ref(1)
const pageSize = ref(20)

const pageData = reactive<PageResponse<PromoterCouponVO>>({
  pageNum: 1,
  pageSize: 20,
  total: 0,
  pages: 0,
  list: [],
})

const DEFAULT_DISCOUNT_TYPE = 'PERCENT'
const DEFAULT_DISCOUNT_VALUE = 10
const DEFAULT_COMMISSION_RATE = 0.3

const discountTypeOptions = [
  { label: '百分比折扣（PERCENT）', value: DEFAULT_DISCOUNT_TYPE },
]

const fmtDate = (v?: string) => {
  if (!v) return '-'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('zh-CN')
}

const parsePromoterId = (v: string): number | null => {
  const s = v.trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const buildDto = (pageNum: number): PromoterCouponQueryDTO => {
  return {
    pageNum,
    pageSize: pageSize.value,
    couponCodeLike: couponCodeLike.value.trim() || null,
    promoterId: parsePromoterId(promoterIdInput.value),
    status: status.value || null,
    orderBy: 'id desc',
  }
}

const load = async (pageNum = 1) => {
  try {
    loading.value = true
    const res = await fetchPromoterCouponPage(buildDto(pageNum))
    if (res.code === 0 && res.data) {
      pageData.pageNum = res.data.pageNum
      pageData.pageSize = res.data.pageSize
      pageData.total = res.data.total
      pageData.pages = res.data.pages
      pageData.list = res.data.list
      currentPage.value = res.data.pageNum
      pageSize.value = res.data.pageSize
    } else {
      pageData.list = []
      pageData.total = 0
      pageData.pages = 0
    }
  } catch (e: any) {
    pageData.list = []
    pageData.total = 0
    pageData.pages = 0
    ElMessage.error(e?.msg || e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  load(1)
}

const handleReset = () => {
  couponCodeLike.value = ''
  promoterIdInput.value = ''
  status.value = undefined
  currentPage.value = 1
  load(1)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  load(1)
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  load(page)
}

const generateLength = ref(4)
const generateLoading = ref(false)

const handleGenerateCode = async () => {
  const len = generateLength.value || 4
  try {
    generateLoading.value = true
    const res = await generateCouponCode(len)
    if (res.code === 0 && typeof res.data === 'string') {
      editForm.couponCode = res.data
    } else {
      ElMessage.error(res.msg || '生成口令失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '生成口令失败')
  } finally {
    generateLoading.value = false
  }
}

const editDialogVisible = ref(false)
const isCreate = ref(true)
const editLoading = ref(false)
const saveLoading = ref(false)

// 本地表单模型，保存时再映射到后端 DTO
const editForm = reactive<any>({
  id: undefined as number | undefined,
  couponCode: '',
  promoterId: undefined as number | undefined,
  campaignId: null as number | null,
  discountType: DEFAULT_DISCOUNT_TYPE,
  discountValue: DEFAULT_DISCOUNT_VALUE as number | null,
  description: '',
  paddleDiscountId: '',
  commissionRate: DEFAULT_COMMISSION_RATE as number | null,
  maxUse: 100000 as number | null,
  usedCount: null as number | null,
  status: 1,
  expireAt: '' as string | null,
})

const resetEditForm = () => {
  editForm.id = undefined
  editForm.couponCode = ''
  editForm.promoterId = undefined
  editForm.campaignId = null
  editForm.discountType = DEFAULT_DISCOUNT_TYPE
  editForm.discountValue = DEFAULT_DISCOUNT_VALUE
  editForm.description = ''
  editForm.paddleDiscountId = ''
  editForm.commissionRate = DEFAULT_COMMISSION_RATE
  editForm.maxUse = 100000
  editForm.usedCount = null
  editForm.status = 1
  editForm.expireAt = ''
}

// 当口令变更时，自动生成描述：Promoter coupon ${code}
watch(
  () => editForm.couponCode,
  (val: string, oldVal: string) => {
    const prefix = 'Promoter coupon '
    const desc: string = editForm.description || ''

    // 当前描述为空，或为基于旧口令的默认描述时，才自动覆盖
    const isOldAuto = !desc || desc === `${prefix}${oldVal ?? ''}`

    if (!val) {
      if (isOldAuto) editForm.description = ''
      return
    }

    if (isOldAuto) {
      editForm.description = `${prefix}${val}`
    }
  }
)

const openCreateDialog = () => {
  isCreate.value = true
  resetEditForm()
  editDialogVisible.value = true
}

const openEditDialog = async (id: number) => {
  try {
    isCreate.value = false
    editDialogVisible.value = true
    editLoading.value = true
    resetEditForm()
    const res = await getPromoterCouponById(id)
    if (res.code === 0 && res.data) {
      editForm.id = res.data.id
      editForm.couponCode = res.data.couponCode
      editForm.promoterId = (res.data.promoterId as number | null | undefined) ?? undefined
      editForm.campaignId = (res.data.campaignId as number | null | undefined) ?? null
      editForm.discountType = res.data.discountType || ''
      editForm.discountValue = (res.data.discountValue as number | null | undefined) ?? null
      editForm.description = (res.data.description as string | null | undefined) ?? ''
      editForm.paddleDiscountId = (res.data.paddleDiscountId as string | null | undefined) ?? ''
      editForm.commissionRate = (res.data.commissionRate as number | null | undefined) ?? null
      editForm.maxUse = (res.data.maxUse as number | null | undefined) ?? null
      editForm.usedCount = (res.data.usedCount as number | null | undefined) ?? null
      editForm.status = (res.data.status as number | null | undefined) ?? 1
      editForm.expireAt = (res.data.expireAt as string | null | undefined) ?? ''
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '加载口令详情失败')
  } finally {
    editLoading.value = false
  }
}

const handleSave = async () => {
  if (!editForm.couponCode.trim()) {
    ElMessage.warning('口令不能为空')
    return
  }
  if (editForm.promoterId == null) {
    ElMessage.warning('请选择推广员')
    return
  }
  // 折扣类型 / 折扣值 / 佣金比例使用固定默认值
  try {
    saveLoading.value = true
    if (isCreate.value) {
      const dto: PromoterCouponCreateDTO = {
        couponCode: editForm.couponCode.trim(),
        promoterId: Number(editForm.promoterId),
        campaignId: editForm.campaignId ?? null,
        discountType: DEFAULT_DISCOUNT_TYPE,
        discountValue: DEFAULT_DISCOUNT_VALUE,
        description: editForm.description?.trim() || null,
        commissionRate: DEFAULT_COMMISSION_RATE,
        maxUse: editForm.maxUse != null ? Number(editForm.maxUse) : null,
        status: typeof editForm.status === 'number' ? editForm.status : null,
        expireAt: editForm.expireAt || null,
      }
      const res = await createPromoterCoupon(dto)
      if (res.code === 0) ElMessage.success('创建成功')
    } else {
      if (!editForm.id) return
      const dto: PromoterCouponUpdateDTO = {
        id: editForm.id,
        couponCode: editForm.couponCode.trim(),
        promoterId: editForm.promoterId != null ? Number(editForm.promoterId) : undefined,
        campaignId: editForm.campaignId ?? undefined,
        discountType: DEFAULT_DISCOUNT_TYPE,
        discountValue: DEFAULT_DISCOUNT_VALUE,
        description: editForm.description?.trim() || undefined,
        paddleDiscountId: editForm.paddleDiscountId?.trim() || undefined,
        commissionRate: DEFAULT_COMMISSION_RATE,
        maxUse: editForm.maxUse != null ? Number(editForm.maxUse) : undefined,
        usedCount: editForm.usedCount != null ? Number(editForm.usedCount) : undefined,
        status: typeof editForm.status === 'number' ? editForm.status : undefined,
        expireAt: editForm.expireAt || undefined,
      }
      const res = await updatePromoterCoupon(dto)
      if (res.code === 0) ElMessage.success('更新成功')
    }
    editDialogVisible.value = false
    await load(currentPage.value)
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '保存失败')
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm(`确认删除口令 ID ${id} 吗？`, '确认', { type: 'warning' })
    const res = await deletePromoterCoupon(id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      await load(currentPage.value)
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.msg || e?.message || '删除失败')
  }
}

onMounted(() => load(1))
</script>

<style scoped lang="scss">
.promoter-coupons-container {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header {
  margin-bottom: 16px;

  h2 {
    margin: 0 0 10px;
    font-size: 20px;
    font-weight: 600;
  }
}

.filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
