<template>
  <div class="watchface-marketing-page">
    <div class="page-header">
      <div>
        <p>输入 Product ID 后自动读取商品信息，生成小红书和 Instagram 帖子草稿。</p>
      </div>
    </div>

    <el-card class="generator-panel" shadow="never">
      <el-form label-position="top">
        <div class="query-row">
          <el-form-item label="Product ID">
            <el-input
              v-model="productId"
              placeholder="例如 10086"
              clearable
              @keyup.enter="handleGenerate"
            />
          </el-form-item>

          <el-button type="primary" :loading="loading" @click="handleGenerate">获取并生成</el-button>
        </div>

        <el-form-item label="补充卖点">
          <el-input
            v-model="extraSellingPoints"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            placeholder="可选。每行一个卖点，例如：适合跑步、低功耗、数据布局清晰。"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert
      v-if="errorMessage"
      class="status-alert"
      type="error"
      :title="errorMessage"
      show-icon
      :closable="false"
    />

    <div v-if="product" class="content-grid">
      <el-card class="product-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>商品信息</span>
            <el-tag v-if="product.status !== undefined" size="small" :type="product.status === 1 ? 'success' : 'info'">
              {{ product.status === 1 ? '已上架' : '未上架' }}
            </el-tag>
          </div>
        </template>

        <div class="product-summary">
          <img v-if="primaryImage" :src="primaryImage" :alt="product.name" class="product-image" />
          <div v-else class="image-placeholder">无预览图</div>

          <div class="product-meta">
            <h3>{{ product.name }}</h3>
            <p>{{ cleanText(product.description) || '暂无描述' }}</p>
            <div class="meta-list">
              <span>App ID: {{ product.appId }}</span>
              <span>Design: {{ product.designId || '—' }}</span>
              <span>Price: {{ priceLabel }}</span>
              <span>Rating: {{ ratingLabel }}</span>
              <span>Downloads: {{ formatNumber(product.download) }}</span>
              <span>Purchases: {{ formatNumber(product.purchase) }}</span>
            </div>
            <el-link v-if="product.garminStoreUrl" :href="product.garminStoreUrl" target="_blank" type="primary">
              Garmin Connect IQ
            </el-link>
          </div>
        </div>
      </el-card>

      <el-card class="asset-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>小红书帖子</span>
            <el-button type="primary" link @click="copyText(xiaohongshuPost)">复制</el-button>
          </div>
        </template>
        <el-input v-model="xiaohongshuPost" type="textarea" :rows="18" />
      </el-card>

      <el-card class="asset-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>Instagram Post</span>
            <el-button type="primary" link @click="copyText(instagramPost)">复制</el-button>
          </div>
        </template>
        <el-input v-model="instagramPost" type="textarea" :rows="18" />
      </el-card>
    </div>

    <div v-if="generatedModel" class="model-note">Model: {{ generatedModel }}</div>

    <el-empty v-if="!product && !loading" description="输入 Product ID 后生成营销文案" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { generateWatchfaceMarketingAssets } from '@/api/marketing-assets'
import type { Product } from '@/types/product'

const productId = ref('')
const extraSellingPoints = ref('')
const loading = ref(false)
const errorMessage = ref('')
const product = ref<Product | null>(null)
const xiaohongshuPost = ref('')
const instagramPost = ref('')
const generatedModel = ref('')

const cleanText = (value?: string | null) => {
  return (value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('en-US').format(value)
}

const primaryImage = computed(() => {
  if (!product.value) return ''
  const firstProductImage = product.value.productImages?.find((item) => item.imageUrl)?.imageUrl
  return firstProductImage || product.value.bannerImageUrl || product.value.garminImageUrl || product.value.rawImageUrl || ''
})

const priceLabel = computed(() => {
  if (!product.value) return '—'
  if (!product.value.price || product.value.price <= 0) return 'Free'
  return `$${product.value.price}`
})

const ratingLabel = computed(() => {
  if (!product.value?.averageRating) return '—'
  const count = product.value.ratingCount ? ` / ${product.value.ratingCount} reviews` : ''
  return `${product.value.averageRating.toFixed(1)}${count}`
})

const handleGenerate = async () => {
  const appId = Number(productId.value)
  if (!Number.isInteger(appId) || appId <= 0) {
    ElMessage.warning('请输入有效的 Product ID')
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''
    const res = await generateWatchfaceMarketingAssets({
      appId,
      sellingPoints: extraSellingPoints.value
    })
    if (res.code !== 0 || !res.data) {
      product.value = null
      errorMessage.value = res.msg || '未找到商品'
      return
    }

    product.value = res.data.product
    xiaohongshuPost.value = res.data.xiaohongshuPost || ''
    instagramPost.value = res.data.instagramPost || ''
    generatedModel.value = res.data.model || ''
  } catch (error: any) {
    product.value = null
    xiaohongshuPost.value = ''
    instagramPost.value = ''
    generatedModel.value = ''
    errorMessage.value = error?.msg || error?.message || '生成营销文案失败'
  } finally {
    loading.value = false
  }
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped>
.watchface-marketing-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #6b7280;
}

.generator-panel {
  margin-bottom: 16px;
  border-radius: 8px;
}

.query-row {
  display: grid;
  grid-template-columns: minmax(220px, 360px) auto;
  gap: 12px;
  align-items: end;
}

.query-row :deep(.el-form-item) {
  margin-bottom: 0;
}

.status-alert {
  margin-bottom: 16px;
}

.model-note {
  margin-top: 10px;
  color: #6b7280;
  font-size: 13px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(360px, 1fr) minmax(360px, 1fr);
  gap: 16px;
  align-items: start;
}

.product-card,
.asset-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.product-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-image,
.image-placeholder {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  object-fit: cover;
  background: #f3f4f6;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.product-meta h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.product-meta p {
  margin: 0 0 12px;
  color: #4b5563;
  line-height: 1.6;
}

.meta-list {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
  color: #374151;
  font-size: 13px;
}

:deep(.el-textarea__inner) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  line-height: 1.55;
}

@media (max-width: 1280px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .watchface-marketing-page {
    padding: 16px;
  }

  .query-row {
    grid-template-columns: 1fr;
  }
}
</style>
