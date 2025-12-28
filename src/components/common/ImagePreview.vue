<template>
  <div class="image-preview" :style="wrapperStyle">
    <el-image
      v-if="src"
      :src="src"
      :preview-src-list="[src]"
      :preview-teleported="true"
      fit="cover"
      :style="imgStyle"
    />
    <div v-else class="empty" :style="imgStyle">无图片</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ImageVO } from '@/types/image'

const props = withDefaults(
  defineProps<{
    image?: ImageVO | null
    height?: number
  }>(),
  {
    height: 50
  }
)

const src = computed(() => {
  const img: any = props.image
  if (!img) return ''
  return img.previewUrl || img.url || img.formats?.thumbnail?.url || ''
})

const ratio = computed(() => {
  const w = Number((props.image as any)?.width)
  const h = Number((props.image as any)?.height)
  if (!w || !h) return 1
  return w / h
})

const widthPx = computed(() => {
  const h = props.height || 50
  return Math.round(h * ratio.value)
})

const wrapperStyle = computed(() => ({
  display: 'inline-flex'
}))

const imgStyle = computed(() => ({
  width: `${widthPx.value}px`,
  height: `${props.height}px`
}))
</script>

<style scoped>
.image-preview {
  display: inline-flex;
}

.empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
  border-radius: 4px;
}
</style>
