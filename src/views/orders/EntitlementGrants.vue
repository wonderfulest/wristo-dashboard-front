<template>
  <div class="grant-page">
    <div class="page-header">
      <div>
        <p>为外部渠道订单创建购买记录，并选择是否计入商家分佣。</p>
      </div>
    </div>

    <section class="grant-panel">
      <el-form
        ref="formRef"
        :model="form"
        label-width="120px"
        class="grant-form"
        @submit.prevent
      >
        <el-form-item label="邮箱" required>
          <el-input v-model.trim="form.email" placeholder="customer@example.com" clearable />
        </el-form-item>

        <el-form-item label="权益类型" required>
          <el-radio-group v-model="form.targetType" @change="handleTargetTypeChange">
            <el-radio-button label="APP">应用</el-radio-button>
            <el-radio-button label="BUNDLE">Bundle</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.targetType === 'APP'" label="赠送方式" required>
          <el-radio-group v-model="form.grantMethod" @change="handleGrantMethodChange">
            <el-radio-button label="APP_ID">选择应用</el-radio-button>
            <el-radio-button label="ACTIVATION_CODE">通过激活码赠送</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.targetType === 'APP' && form.grantMethod === 'APP_ID'" label="应用 ID" required>
          <AppSearchSelect v-model="form.appId" :width="'100%'" />
        </el-form-item>

        <el-form-item v-else-if="form.targetType === 'APP'" label="六位激活码" required>
          <el-input
            v-model.trim="form.activationCode"
            class="full-input"
            maxlength="6"
            inputmode="numeric"
            placeholder="输入手表显示的六位激活码"
            clearable
          />
          <div class="field-help">将自动识别应用、绑定到该邮箱并直接激活。</div>
        </el-form-item>

        <el-form-item v-else label="Bundle" required>
          <el-select
            v-model="form.bundleId"
            class="full-input"
            filterable
            clearable
            :loading="bundlesLoading"
            placeholder="选择已启用 Bundle"
            no-data-text="暂无已启用 Bundle"
            popper-class="bundle-select-dropdown"
            @visible-change="handleBundleDropdownVisible"
          >
            <el-option
              v-for="bundle in activeBundles"
              :key="bundle.bundleId"
              :label="bundleOptionLabel(bundle)"
              :value="bundle.bundleId"
            >
              <div class="bundle-option">
                <div class="bundle-option-main">
                  <span>{{ bundle.bundleName || `Bundle #${bundle.bundleId}` }}</span>
                  <el-tag size="small" :type="bundleTypeTag(bundle.bundleType)" effect="plain">
                    {{ bundleTypeLabel(bundle.bundleType) }}
                  </el-tag>
                </div>
                <div class="bundle-option-meta">
                  <span>#{{ bundle.bundleId }}</span>
                  <span>{{ designerName(bundle) }}</span>
                  <span>{{ bundle.appCount ?? bundle.products?.length ?? 0 }} apps</span>
                  <span>${{ formatCurrency(bundle.price) }}</span>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="渠道" required>
          <el-select v-model="form.channel" placeholder="选择渠道" class="full-input">
            <el-option label="淘宝" value="taobao" />
            <el-option label="小红书" value="xiaohongshu" />
            <el-option label="闲鱼" value="xianyu" />
            <el-option label="国内网站" value="wristo_cn" />
            <el-option label="Other" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="外部订单号">
          <el-input v-model.trim="form.externalOrderId" placeholder="可选，用于追踪外部平台订单" clearable />
        </el-form-item>

        <el-form-item label="商家分佣" required>
          <el-radio-group v-model="form.commissionEnabled">
            <el-radio-button :label="false">不分佣</el-radio-button>
            <el-radio-button :label="true">分佣</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <template v-if="form.commissionEnabled">
          <el-form-item label="支付方式" required>
            <el-select v-model="form.paymentMethod" placeholder="选择支付方式" class="full-input">
              <el-option label="支付宝" value="alipay" />
              <el-option label="微信" value="wechat" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>

          <el-form-item label="国内售价总价" required>
            <el-input-number
              v-model="form.giftAmountCny"
              :min="0.01"
              :precision="2"
              :step="1"
              controls-position="right"
              class="full-input"
            />
            <span class="field-unit">CNY</span>
          </el-form-item>

          <el-form-item label="汇率" required>
            <el-input-number
              v-model="form.giftExchangeRate"
              :min="0.000001"
              :precision="6"
              :step="0.1"
              controls-position="right"
              class="full-input"
            />
            <span class="field-unit">CNY / USD</span>
          </el-form-item>

          <el-form-item label="预计商家收益">
            <strong class="commission-preview">
              {{ commissionUsd === null ? '-' : `$${commissionUsd.toFixed(2)} USD` }}
            </strong>
          </el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submitGrant">创建赠送记录</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section v-if="result" class="result-panel">
      <div class="result-header">
        <div>
          <h2>购买记录可用</h2>
          <p>Purchase Record #{{ result.id }}</p>
        </div>
        <el-button type="primary" plain @click="openOrderHistory">查看订单记录</el-button>
      </div>

      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="邮箱">{{ result.email }}</el-descriptions-item>
        <el-descriptions-item label="Payment">{{ result.paymentMethod }}</el-descriptions-item>
        <el-descriptions-item label="Origin">{{ result.origin }}</el-descriptions-item>
        <el-descriptions-item label="Commission">{{ result.commissionEnabled ? 'Commissioned' : 'No commission' }}</el-descriptions-item>
        <el-descriptions-item v-if="result.commissionEnabled" label="CNY Total">¥{{ formatCurrency(result.giftAmountCny) }}</el-descriptions-item>
        <el-descriptions-item v-if="result.commissionEnabled" label="Exchange Rate">{{ result.giftExchangeRate }} CNY/USD</el-descriptions-item>
        <el-descriptions-item v-if="result.commissionEnabled" label="Merchant Earnings">${{ formatCurrency(result.earnings / 100) }} USD</el-descriptions-item>
        <el-descriptions-item label="App ID">{{ result.appId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Bundle ID">{{ result.bundleId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Product" :span="2">{{ result.product?.name || result.bundle?.bundleName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Transaction ID" :span="2">{{ result.transactionId }}</el-descriptions-item>
      </el-descriptions>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import { fetchAdminBundlePage } from '@/api/bundles'
import { giftEntitlement } from '@/api/purchase'
import { calculateGiftCommissionUsd, validateGiftPaymentMethod } from './giftEntitlementCommission.mjs'
import { buildGiftTargetPayload, validateGiftTarget } from './giftEntitlementGrant.mjs'
import type { Bundle } from '@/types/bundle'
import type {
  GiftEntitlementChannel,
  GiftEntitlementPaymentMethod,
  GiftEntitlementTargetType,
  PurchaseRecordVO,
} from '@/types/api'

interface GrantForm {
  email: string
  targetType: GiftEntitlementTargetType
  appId: number | null | undefined
  grantMethod: 'APP_ID' | 'ACTIVATION_CODE'
  activationCode: string
  bundleId: number | null | undefined
  channel: GiftEntitlementChannel
  externalOrderId: string
  commissionEnabled: boolean
  paymentMethod: GiftEntitlementPaymentMethod | null
  giftAmountCny: number | null
  giftExchangeRate: number
}

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const result = ref<PurchaseRecordVO | null>(null)
const bundlesLoading = ref(false)
const activeBundles = ref<Bundle[]>([])
const ACTIVE_BUNDLE_PAGE_SIZE = 100

const form = reactive<GrantForm>({
  email: '',
  targetType: 'APP',
  appId: null,
  grantMethod: 'APP_ID',
  activationCode: '',
  bundleId: null,
  channel: 'wristo_cn',
  externalOrderId: '',
  commissionEnabled: false,
  paymentMethod: null,
  giftAmountCny: null,
  giftExchangeRate: 6.5,
})

const handleTargetTypeChange = () => {
  result.value = null
  if (form.targetType === 'APP') {
    form.bundleId = null
  } else {
    form.appId = null
    form.activationCode = ''
    loadActiveBundles()
  }
}

const handleGrantMethodChange = () => {
  result.value = null
  if (form.grantMethod === 'APP_ID') {
    form.activationCode = ''
  } else {
    form.appId = null
  }
}

const validateForm = (): string | null => {
  if (!form.email || !form.email.includes('@')) return '请输入有效邮箱'
  const targetError = validateGiftTarget(
    form.targetType,
    form.grantMethod,
    form.appId,
    form.bundleId,
    form.activationCode
  )
  if (targetError) return targetError
  if (!form.channel) return '请选择渠道'
  const paymentMethodError = validateGiftPaymentMethod(form.commissionEnabled, form.paymentMethod)
  if (paymentMethodError) return paymentMethodError
  if (form.commissionEnabled && (!form.giftAmountCny || form.giftAmountCny <= 0)) return '请输入大于 0 的国内售价总价'
  if (form.commissionEnabled && (!form.giftExchangeRate || form.giftExchangeRate <= 0)) return '请输入大于 0 的汇率'
  return null
}

const commissionUsd = computed(() => {
  if (!form.commissionEnabled) return null
  return calculateGiftCommissionUsd(form.giftAmountCny, form.giftExchangeRate)
})

const selectedBundle = computed(() => {
  return activeBundles.value.find((bundle) => bundle.bundleId === form.bundleId) || null
})

const targetLabel = () => {
  if (form.targetType === 'APP' && form.grantMethod === 'ACTIVATION_CODE') {
    return `激活码 ${form.activationCode} 对应的应用（绑定邮箱并直接激活）`
  }
  if (form.targetType === 'APP') return `应用 ${form.appId}`
  const bundle = selectedBundle.value
  if (!bundle) return `Bundle ${form.bundleId}`
  return `${bundle.bundleName || 'Bundle'} (#${bundle.bundleId})`
}

const designerName = (bundle: Bundle) => {
  return bundle.user?.nickname || bundle.user?.username || bundle.user?.email || `用户 ${bundle.userId || '-'}`
}

const formatCurrency = (value?: number | null) => {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
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

const bundleOptionLabel = (bundle: Bundle) => {
  return `${bundle.bundleName || 'Bundle'} #${bundle.bundleId} ${bundleTypeLabel(bundle.bundleType)}`
}

const loadActiveBundles = async (force = false) => {
  if (bundlesLoading.value) return
  if (!force && activeBundles.value.length > 0) return

  bundlesLoading.value = true
  try {
    const bundles: Bundle[] = []
    let pageNum = 1
    let pages = 1
    do {
      const res = await fetchAdminBundlePage({
        pageNum,
        pageSize: ACTIVE_BUNDLE_PAGE_SIZE,
        isActive: 1,
        orderBy: 'updated_at:desc'
      })
      const page = res.data
      bundles.push(...(page?.list || []))
      pages = Math.max(1, Number(page?.pages || 1))
      pageNum += 1
    } while (pageNum <= pages)

    activeBundles.value = bundles
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || e?.msg || e?.message || '加载 Bundle 列表失败')
  } finally {
    bundlesLoading.value = false
  }
}

const handleBundleDropdownVisible = (visible: boolean) => {
  if (visible) loadActiveBundles()
}

const submitGrant = async () => {
  const error = validateForm()
  if (error) {
    ElMessage.error(error)
    return
  }

  try {
    const commissionNotice = form.commissionEnabled
      ? `将按 ¥${formatCurrency(form.giftAmountCny ?? 0)} ÷ ${form.giftExchangeRate} = $${formatCurrency(commissionUsd.value ?? 0)} USD 计入商家收益，并展示在商家后台。`
      : '该购买记录不会计入商家分佣，也不会展示在商家后台。'
    await ElMessageBox.confirm(
      `确认给 ${form.email} 赠送 ${targetLabel()} 权益？${commissionNotice}`,
      '确认赠送权益',
      {
        confirmButtonText: '确认创建',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false,
      }
    )
    submitting.value = true
    const targetPayload = buildGiftTargetPayload(
      form.targetType,
      form.grantMethod,
      form.appId,
      form.bundleId,
      form.activationCode
    )
    const res = await giftEntitlement({
      email: form.email,
      targetType: form.targetType,
      ...targetPayload,
      channel: form.channel,
      externalOrderId: form.externalOrderId || null,
      commissionEnabled: form.commissionEnabled,
      paymentMethod: form.commissionEnabled ? form.paymentMethod : null,
      giftAmountCny: form.commissionEnabled ? form.giftAmountCny : null,
      giftExchangeRate: form.commissionEnabled ? form.giftExchangeRate : null,
    })
    if (res.code === 0 && res.data) {
      result.value = res.data
      ElMessage.success('购买记录可用')
    } else {
      ElMessage.error(res.msg || '创建赠送记录失败')
    }
  } catch (e: any) {
    if (e === 'cancel' || e === 'close') return
    ElMessage.error(e?.response?.data?.msg || e?.msg || e?.message || '创建赠送记录失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.email = ''
  form.targetType = 'APP'
  form.appId = null
  form.grantMethod = 'APP_ID'
  form.activationCode = ''
  form.bundleId = null
  form.channel = 'wristo_cn'
  form.externalOrderId = ''
  form.commissionEnabled = false
  form.paymentMethod = null
  form.giftAmountCny = null
  form.giftExchangeRate = 6.5
  result.value = null
  formRef.value?.clearValidate()
}

const openOrderHistory = () => {
  const query: Record<string, string> = { email: result.value?.email || form.email }
  const appId = result.value?.appId || form.appId
  const bundleId = result.value?.bundleId || form.bundleId
  if (appId) query.appId = String(appId)
  if (bundleId) query.bundleId = String(bundleId)
  router.push({ path: '/orders/history', query })
}
</script>

<style scoped>
.grant-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

.page-header h1,
.result-header h2 {
  margin: 0;
  color: #1f2937;
}

.page-header p,
.result-header p {
  margin: 6px 0 0;
  color: #6b7280;
}

.grant-panel,
.result-panel {
  max-width: 820px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 22px;
}

.result-panel {
  margin-top: 18px;
}

.grant-form {
  max-width: 620px;
}

.full-input {
  width: 100%;
}

.field-unit {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}

.field-help {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.commission-preview {
  color: #16a34a;
}

.bundle-option {
  padding: 5px 0;
  line-height: 1.25;
}

.bundle-option-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-weight: 600;
  color: #303133;
}

.bundle-option-main span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bundle-option-meta {
  display: flex;
  gap: 10px;
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

:global(.bundle-select-dropdown .el-select-dropdown__item) {
  height: auto;
  min-height: 34px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .grant-page {
    padding: 16px;
  }

  .grant-form {
    max-width: none;
  }

  .result-header {
    flex-direction: column;
  }
}
</style>
