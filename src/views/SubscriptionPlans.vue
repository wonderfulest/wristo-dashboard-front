<template>
  <div class="subscription-plans-container">
    <div class="header">
      <el-button type="primary" @click="handleAdd">新增订阅计划</el-button>
    </div>
    <el-table :data="subscriptionPlans" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="planCode" label="计划编码" />
      <el-table-column prop="name" label="计划名称" />
      <el-table-column label="时长" width="120">
        <template #default="{ row }">
          <span>{{ row.durationDays === -1 ? '永久' : `${row.durationDays}天` }}</span>
        </template>
      </el-table-column>
      <el-table-column label="价格" width="180">
        <template #default="{ row }">
          <div>
            <div>原价: {{ formatPrice(row.originalPrice, row.currencyCode) }}</div>
            <div v-if="row.discountPrice !== null && row.discountPrice !== undefined">
              折扣价: {{ formatPrice(row.discountPrice, row.currencyCode) }}
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="赠品套餐" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isGift ? 'success' : 'info'">
            {{ row.isGift ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.isActive"
            :active-value="1"
            :inactive-value="0"
            @change="(val: number) => handleStatusChange(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增订阅计划' : '编辑订阅计划'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="计划编码" prop="planCode">
          <el-input v-model="form.planCode" placeholder="请输入计划编码，如: monthly, lifetime" />
        </el-form-item>
        <el-form-item label="计划名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="时长(天)" prop="durationDays">
          <el-input-number v-model="form.durationDays" :min="-1" placeholder="请输入时长，-1表示永久" />
          <span class="form-tip">-1表示永久</span>
        </el-form-item>
        <el-form-item label="原价" prop="originalPrice">
          <el-input-number 
            v-model="form.originalPrice" 
            :precision="2" 
            :step="0.01" 
            :min="0" 
            placeholder="请输入原价" 
          />
        </el-form-item>
        <el-form-item label="折扣价" prop="discountPrice">
          <el-input-number 
            v-model="form.discountPrice" 
            :precision="2" 
            :step="0.01" 
            :min="0" 
            placeholder="请输入折扣价（可选）" 
          />
        </el-form-item>
        <el-form-item label="货币代码" prop="currencyCode">
          <el-select v-model="form.currencyCode" placeholder="请选择货币代码">
            <el-option label="USD (美元)" value="USD" />
            <el-option label="CNY (人民币)" value="CNY" />
            <el-option label="EUR (欧元)" value="EUR" />
            <el-option label="GBP (英镑)" value="GBP" />
            <el-option label="JPY (日元)" value="JPY" />
          </el-select>
        </el-form-item>
        <el-form-item label="赠品套餐" prop="isGift">
          <el-switch
            v-model="form.isGift"
            :active-value="true"
            :inactive-value="false"
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
        <el-form-item label="状态" prop="isActive">
          <el-switch
            v-model="form.isActive"
            :active-value="true"
            :inactive-value="false"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { 
  createSubscriptionPlan, 
  updateSubscriptionPlan, 
  getAllSubscriptionPlans, 
  deleteSubscriptionPlan 
} from '@/api/subscription'
import type { SubscriptionPlan, SubscriptionPlanDTO } from '@/types/subscription'

// 表格数据
const subscriptionPlans = ref<SubscriptionPlan[]>([])
const loading = ref(false)

// 表单相关
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const form = ref<SubscriptionPlanDTO>({
  planCode: '',
  name: '',
  durationDays: 30,
  isGift: false,
  originalPrice: 0,
  discountPrice: undefined,
  currencyCode: 'USD',
  isActive: true
})

const rules: FormRules = {
  planCode: [
    { required: true, message: '请输入计划编码', trigger: 'blur' },
    { pattern: /^[a-z0-9_-]+$/, message: '只能包含小写字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  durationDays: [
    { required: true, message: '请输入时长', trigger: 'blur' }
  ],
  originalPrice: [
    { required: true, message: '请输入原价', trigger: 'blur' },
    { type: 'number', min: 0, message: '原价不能小于0', trigger: 'blur' }
  ],
  currencyCode: [
    { required: true, message: '请选择货币代码', trigger: 'change' }
  ]
}

// 格式化价格显示
const formatPrice = (price: number, currencyCode: string): string => {
  if (price === undefined || price === null) return '-'
  
  const currencySymbols: Record<string, string> = {
    USD: '$',
    CNY: '¥',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
  }
  
  const symbol = currencySymbols[currencyCode] || currencyCode
  return `${symbol}${price.toFixed(2)}`
}

// 获取订阅计划列表
const fetchSubscriptionPlans = async () => {
  loading.value = true
  try {
    const res = await getAllSubscriptionPlans()
    if (res.code === 0) {
      subscriptionPlans.value = res.data || []
    } else {
      ElMessage.error(res.msg || '获取订阅计划列表失败')
    }
  } catch (error) {
    ElMessage.error('获取订阅计划列表失败')
  } finally {
    loading.value = false
  }
}

// 新增订阅计划
const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    planCode: '',
    name: '',
    durationDays: 30,
    isGift: false,
    originalPrice: 0,
    discountPrice: undefined,
    currencyCode: 'USD',
    isActive: true
  }
  dialogVisible.value = true
}

// 编辑订阅计划
const handleEdit = (row: SubscriptionPlan) => {
  dialogType.value = 'edit'
  form.value = {
    id: row.id,
    planCode: row.planCode,
    name: row.name,
    durationDays: row.durationDays,
    isGift: row.isGift,
    originalPrice: row.originalPrice,
    discountPrice: row.discountPrice,
    currencyCode: row.currencyCode,
    isActive: row.isActive === 1
  }
  dialogVisible.value = true
}

// 删除订阅计划
const handleDelete = (row: SubscriptionPlan) => {
  ElMessageBox.confirm(
    '确定要删除该订阅计划吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await deleteSubscriptionPlan(row.id)
      if (res.code === 0) {
        ElMessage.success('删除成功')
        fetchSubscriptionPlans()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 转换布尔值到数字
        const submitData: SubscriptionPlanDTO = {
          ...form.value,
          isActive: form.value.isActive
        }

        if (dialogType.value === 'add') {
          const res = await createSubscriptionPlan(submitData)
          if (res.code === 0) {
            ElMessage.success('新增成功')
            dialogVisible.value = false
            fetchSubscriptionPlans()
          } else {
            ElMessage.error(res.msg || '新增失败')
          }
        } else {
          const res = await updateSubscriptionPlan(submitData)
          if (res.code === 0) {
            ElMessage.success('更新成功')
            dialogVisible.value = false
            fetchSubscriptionPlans()
          } else {
            ElMessage.error(res.msg || '更新失败')
          }
        }
      } catch (error) {
        ElMessage.error(dialogType.value === 'add' ? '新增失败' : '更新失败')
      }
    }
  })
}

// 切换订阅计划状态
const handleStatusChange = async (row: SubscriptionPlan, val: number) => {
  try {
    const updateData: SubscriptionPlanDTO = {
      id: row.id,
      planCode: row.planCode,
      name: row.name,
      durationDays: row.durationDays,
      originalPrice: row.originalPrice,
      currencyCode: row.currencyCode,
      isActive: val === 1
    }
    
    const res = await updateSubscriptionPlan(updateData)
    if (res.code === 0) {
      ElMessage.success('状态更新成功')
      fetchSubscriptionPlans()
    } else {
      ElMessage.error(res.msg || '状态更新失败')
    }
  } catch (error) {
    ElMessage.error('状态更新失败')
    // 回滚UI
    row.isActive = val === 1 ? 0 : 1
  }
}

onMounted(() => {
  fetchSubscriptionPlans()
})
</script>

<style scoped>
.subscription-plans-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>
