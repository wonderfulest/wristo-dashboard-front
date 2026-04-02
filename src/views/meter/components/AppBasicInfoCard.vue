<template>
  <el-card class="section-card" shadow="never" v-loading="loading">
    <template #header>
      <div class="card-header">
        <span>应用基础信息</span>
        <el-button
          v-if="product?.garminStoreUrl"
          type="primary"
          link
          @click="openStoreUrl(product.garminStoreUrl)"
        >
          打开 Garmin 商店页
        </el-button>
      </div>
    </template>

    <el-empty v-if="!product" description="暂无应用信息" />

    <template v-else>
      <div class="product-overview">
        <div class="product-cover">
          <el-image
            v-if="imageUrl"
            :src="imageUrl"
            fit="cover"
            class="product-cover__image"
            preview-teleported
          />
          <div v-else class="product-cover__placeholder">暂无图片</div>
          <div class="product-name">{{ product.name || '-' }}</div>
        </div>

        <div class="product-main">
          <!-- <div class="product-main__title">
            <div>
              <div class="product-name">{{ product.name || '-' }}</div>
              <div class="product-desc">{{ product.description || '暂无描述' }}</div> 
            </div>
          </div> -->

          <el-row :gutter="16" class="stats-cards product-summary">
            <el-col :span="12"><el-statistic title="总下载" :value="product.download ?? 0" /></el-col>
            <el-col :span="12"><el-statistic title="购买数" :value="product.purchase ?? 0" /></el-col>
          </el-row>

          <el-descriptions :column="2" border class="stats-detail">
            <el-descriptions-item label="AppID">{{ product.appId ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="价格">{{ formatPriceDisplay(product.price) }}</el-descriptions-item>
            <el-descriptions-item label="试用期">{{ formatTrialDisplay(product.trialLasts) }}</el-descriptions-item>
            <el-descriptions-item label="设计ID">
              <span class="mono">{{ product.designId || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="Garmin UUID">
              <span class="mono">{{ product.garminAppUuid || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="最后上架时间">{{ formatDateDisplay(product.lastGoLive) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { formatDateTime } from '@/utils/date'
import type { Product } from '@/types/product'

defineProps<{
  loading: boolean
  product: Product | null
  imageUrl: string
}>()

const openStoreUrl = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}

const formatDateDisplay = (v?: string | null) => {
  if (!v) return '-'
  return formatDateTime(v)
}

const formatPriceDisplay = (v?: number | null) => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n)) return '-'
  return `$${n.toFixed(2)}`
}

const formatTrialDisplay = (v?: number | null) => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n) || n <= 0) return '无试用'
  if (Number.isInteger(n)) return `${n} 小时`
  return `${n.toFixed(2)} 小时`
}
</script>

<style scoped>
.section-card { margin-bottom: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.stats-cards { margin-bottom: 20px; }
.stats-cards .el-statistic { background: var(--el-bg-color-page); border-radius: 8px; padding: 16px; }
.stats-detail { margin-top: 8px; }
.product-overview { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
.product-cover { width: 180px; flex: 0 0 180px; }
.product-cover__image,
.product-cover__placeholder {
  width: 180px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}
.product-cover__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}
.product-main { flex: 1; min-width: 320px; }
.product-main__title { margin-bottom: 16px; }
.product-name { font-size: 22px; font-weight: 700; color: #303133; line-height: 1.3; }
.product-desc { margin-top: 8px; color: #606266; line-height: 1.6; white-space: pre-wrap; }
.product-summary { margin-bottom: 0; }
</style>
