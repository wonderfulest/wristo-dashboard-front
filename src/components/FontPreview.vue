<template>
  <div class="font-preview" :class="{ full }" :style="previewStyle" :title="title">
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
  type?: string
  sectionName?: string
  size?: number | string
  full?: boolean
}>()

const ICON_FONT_UNICODES = [
  '0020','0021','0022','0023','0024','0025','0026','0027','0028','0029',
  '002a','0030','0031','0032','0033','0034','0035','0036','0037','0038',
  '0039','003a','003b','003c','003d','003e','0040','0041','0042','0043',
  '0044','0045','0046','0047','0048','0049','0060','0061','0062','0063',
  '0064','0065','0066','101d','101e','102d','102e','103d','104d','109d',
  '110d','110e','111d','113d','150d'
]

const iconPreviewText = String.fromCodePoint(
  ...ICON_FONT_UNICODES.map(code => parseInt(code, 16))
)



const sampleText = computed(() => {
  // 允许外部自定义 sampleText，优先级最高
  if (props.sampleText) return props.sampleText

  if (props.type === 'icon_font') {
    console.log(99, props.name, iconPreviewText)
    return iconPreviewText
  }

  const t = props.type?.toLowerCase() || ''
  if (t.includes('number')) {
    return '0123456789:'
  }
  return '12:34 AM 72°F & Sunny 0123456789'
})
const title = computed(() => props.name || '')
const familyName = ref('system-ui')

const previewStyle = computed(() => {
  const style: Record<string, string> = { fontFamily: familyName.value }
  if (props.size != null) {
    style.fontSize = typeof props.size === 'number' ? `${props.size}px` : String(props.size)
  }
  return style
})

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
  margin: 0 auto;
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
