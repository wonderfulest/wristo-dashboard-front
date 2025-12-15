<template>
  <div class="image-upload">
    <el-upload
      class="upload"
      :show-file-list="false"
      :http-request="doUpload"
      :before-upload="beforeUpload"
      accept="image/*"
      :disabled="uploading"
    >
      <div
        class="box"
        :class="{ 'is-drag-over': dragOver }"
        @dragenter.prevent="onDragEnter"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
      >
        <div v-if="previewUrl" class="img">
          <el-image :src="previewUrl" fit="cover" style="width: 100%; height: 100%" />
        </div>
        <div v-else class="placeholder">+</div>

        <div v-if="ratioTip" class="ratio-tip" :title="ratioTip">{{ ratioTip }}</div>

        <div v-if="uploading" class="mask">上传中...</div>
        <button v-if="modelValue" type="button" class="clear" :disabled="uploading" @click.stop="clear">×</button>
      </div>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadImage } from '@/api/image'
import { IMAGE_ASPECT_ENUM_NAME, useEnumStore } from '@/store/common'
import type { ImageVO } from '@/types/image'

const extractRatio = (it: any): string => {
  const candidates = [it?.props?.ratio, it?.ratio, it?.category, it?.description, it?.name, it?.value]
    .filter((x) => typeof x === 'string')
    .join(' ')
  const m = candidates.match(/(\d+)\s*:\s*(\d+)/)
  if (!m) return ''
  return `${m[1]}:${m[2]}`
}

const props = withDefaults(
  defineProps<{
    modelValue?: number
    maxSizeMB?: number
    previewUrl?: string
    aspectCode?: string
  }>(),
  {
    maxSizeMB: 10
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', v?: number): void
  (e: 'uploaded', v: ImageVO): void
}>()

const uploading = ref(false)
const preview = ref<string>('')
const dragOver = ref(false)

const previewUrl = computed(() => preview.value)

const aspectRatioMap = ref<Record<string, string>>({})
const aspectEnumCodes = ref<string[]>([])

const enumStore = useEnumStore()

const validAspectCodes = computed(() => aspectEnumCodes.value)

const ensureAspectCodeValid = async () => {
  await initAspectRatioMap()
  const code = props.aspectCode
  if (!code) return false

  const ok = validAspectCodes.value.includes(code)
  if (!ok) {
    console.warn('[ImageUpload] Invalid aspectCode', {
      aspectCode: code,
      validAspectCodes: validAspectCodes.value,
      ratioMap: aspectRatioMap.value
    })
    ElMessage.error(`图片尺寸类型不合法：${code}`)
  }
  return ok
}

const initAspectRatioMap = async () => {
  if (Object.keys(aspectRatioMap.value).length > 0) return
  const list = await enumStore.getEnumOptions(IMAGE_ASPECT_ENUM_NAME)
  const map: Record<string, string> = {}
  const codes: string[] = []
  for (const it of list || []) {
    const code = (it as any)?.value
    if (!code || typeof code !== 'string') continue
    codes.push(code)
    const ratio = extractRatio(it)
    map[code] = ratio || '1:1'
  }
  aspectRatioMap.value = map
  aspectEnumCodes.value = codes

  console.debug('[ImageUpload] Loaded ImageAspectEnum', {
    enumName: IMAGE_ASPECT_ENUM_NAME,
    optionsCount: Array.isArray(list) ? list.length : 0,
    optionsSample: Array.isArray(list) ? list.slice(0, 10) : list,
    ratioMapKeys: Object.keys(map)
  })
}

const aspectRatioCss = computed(() => {
  const ratio = props.aspectCode ? aspectRatioMap.value[props.aspectCode] : undefined
  const r = ratio || '1:1'
  const [w, h] = r.split(':').map((x) => Number(x))
  if (!w || !h) return '1 / 1'
  return `${w} / ${h}`
})

const ratioTip = computed(() => {
  if (!props.aspectCode) return ''
  const ratio = aspectRatioMap.value[props.aspectCode] || '1:1'
  return `${ratio}`
})

onMounted(async () => {
  await initAspectRatioMap()
})

watch(
  () => props.aspectCode,
  async (v) => {
    if (v) {
      await initAspectRatioMap()
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (v) => {
    if (!v) {
      preview.value = ''
      return
    }
    if (!preview.value && props.previewUrl) {
      preview.value = props.previewUrl
    }
  }
)

watch(
  () => props.previewUrl,
  (u) => {
    if (u) {
      preview.value = u
      return
    }
    if (!props.modelValue) {
      preview.value = ''
    }
  },
  { immediate: true }
)

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('仅支持上传图片文件')
    return false
  }
  const max = props.maxSizeMB || 10
  const sizeOk = file.size / 1024 / 1024 <= max
  if (!sizeOk) {
    ElMessage.error(`图片大小不能超过 ${max}MB`)
    return false
  }
  return true
}

const uploadRawFile = async (raw: File) => {
  if (!beforeUpload(raw)) return

  const ok = await ensureAspectCodeValid()
  if (!ok) return

  uploading.value = true
  try {
    const res = await uploadImage(raw, props.aspectCode)
    const img = (res as any)?.data as ImageVO | undefined
    if (!img?.id) {
      throw new Error('上传失败')
    }
    emit('update:modelValue', img.id)
    preview.value = img.previewUrl || (img as any)?.formats?.thumbnail?.url || img.url || ''
    emit('uploaded', img)
    ElMessage.success('图片已上传')
  } catch (e: any) {
    ElMessage.error(e?.msg || '上传失败')
  } finally {
    uploading.value = false
  }
}

const doUpload = async (options: any) => {
  const raw: File | null = options?.file || null
  if (!raw) return

  await uploadRawFile(raw)
}

const onDragEnter = () => {
  if (uploading.value) return
  dragOver.value = true
}
const onDragOver = () => {
  if (uploading.value) return
  dragOver.value = true
}
const onDragLeave = () => {
  dragOver.value = false
}
const onDrop = async (evt: DragEvent) => {
  dragOver.value = false
  if (uploading.value) return
  const file = evt.dataTransfer?.files?.[0]
  if (!file) return
  await uploadRawFile(file)
}

const clear = () => {
  emit('update:modelValue', undefined)
  preview.value = ''
}
</script>

<style scoped>
.image-upload { display: inline-flex; }
.upload { display: inline-flex; }
.box {
  width: auto;
  height: 120px;
  aspect-ratio: v-bind(aspectRatioCss);
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.box.is-drag-over {
  border-color: #19b36b;
  background: rgba(25, 179, 107, 0.08);
}
.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #c0c4cc;
  user-select: none;
}
.img { width: 100%; height: 100%; }
.mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
.ratio-tip {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 12px;
  line-height: 16px;
  z-index: 2;
  pointer-events: none;
}
.clear {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  text-align: center;
  cursor: pointer;
}
</style>
