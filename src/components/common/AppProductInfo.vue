<template>
  <div class="product-info">
    <el-image
      v-if="imgUrl"
      :src="imgUrl"
      :preview-src-list="[imgUrl]"
      :z-index="5000"
      :preview-teleported="true"
      fit="cover"
      class="product-thumb"
      :style="{ width: thumbPx + 'px', height: thumbPx + 'px' }"
    />
    <div class="product-meta">
      <div class="product-name">
        <a v-if="storeUrl" :href="storeUrl" target="_blank" rel="noopener noreferrer">{{ title }}</a>
        <span v-else>{{ title }}</span>
        <a
          v-if="designId"
          :href="`http://studio.wristo.io/design?id=${encodeURIComponent(String(designId))}`"
          target="_blank"
          rel="noopener noreferrer"
          style="margin-left: 8px"
        >
          <el-button link type="primary" size="small">
            <el-icon><Edit /></el-icon>
          </el-button>
        </a>
      </div>
      <div class="product-details">
        <span>appId: {{ displayAppId }}</span>
        <span v-if="designId">设计ID: {{ designId }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Edit } from '@element-plus/icons-vue'
import type { ProductBase } from '@/types/product'

const props = withDefaults(
  defineProps<{
    product?: (ProductBase & { [k: string]: any }) | null
    appId?: number | null
    thumbSize?: number
    title?: string
    designId?: string
    imageUrl?: string
    storeUrl?: string
  }>(),
  {
    thumbSize: 56
  }
)

const thumbPx = computed(() => props.thumbSize || 56)

const displayAppId = computed(() => {
  const p: any = props.product
  return p?.appId ?? props.appId ?? '-'
})

const title = computed(() => {
  if (props.title) return props.title
  const p: any = props.product
  const name = p?.name
  if (name) return name
  const id = displayAppId.value
  return id === '-' ? '-' : `AppID: ${id}`
})

const storeUrl = computed(() => {
  if (props.storeUrl) return props.storeUrl
  const p: any = props.product
  return p?.garminStoreUrl || ''
})

const designId = computed(() => {
  if (props.designId) return props.designId
  const p: any = props.product
  return p?.designId || ''
})

const imgUrl = computed(() => {
  if (props.imageUrl) return props.imageUrl
  const p: any = props.product
  return p?.garminImageUrl || p?.heroFile?.url || p?.heroImages?.[0]?.url || ''
})
</script>

<style scoped>
.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-thumb {
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  flex: 0 0 auto;
}

.product-meta {
  min-width: 0;
}

.product-name {
  display: flex;
  align-items: center;
  min-width: 0;
}

.product-name a,
.product-name span {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-details {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}
</style>
