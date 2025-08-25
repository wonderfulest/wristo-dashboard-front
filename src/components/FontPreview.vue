<template>
  <div class="font-preview" :class="{ full }" :style="{ fontFamily: familyName }" :title="title">
    {{ sampleText }}
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  id?: number | string
  name?: string
  url?: string | null
  sampleText?: string
  full?: boolean
}>()

const sampleText = computed(() => props.sampleText || '0123456789ABCabc°')
const title = computed(() => props.name || '')
const familyName = ref('system-ui')

const cache = (window as any).__fontPreviewCache || ((window as any).__fontPreviewCache = new Map())

const loadFont = async () => {
  if (!props.url) {
    familyName.value = 'system-ui'
    return
  }
  const key = `${props.id || props.name || props.url}`
  if (cache.has(key)) {
    familyName.value = cache.get(key)
    return
  }
  const fam = `FontPreview-${btoa(unescape(encodeURIComponent(key))).replace(/=/g, '')}`
  try {
    const fontFace = new FontFace(fam, `url(${props.url})`)
    await fontFace.load()
    ;(document as any).fonts.add(fontFace)
    cache.set(key, fam)
    familyName.value = fam
  } catch (e) {
    familyName.value = 'system-ui'
  }
}

onMounted(loadFont)
watch(() => props.url, loadFont)
watch(() => props.id, loadFont)
</script>

<style scoped>
.font-preview {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 16px;
}
.font-preview.full {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  display: block;
  max-width: 480px;
  line-height: 1.3;
}
</style>
