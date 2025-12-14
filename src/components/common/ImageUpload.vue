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

        <div v-if="uploading" class="mask">上传中...</div>
        <button v-if="modelValue" type="button" class="clear" :disabled="uploading" @click.stop="clear">×</button>
      </div>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadImage } from '@/api/image'
import type { ImageVO } from '@/types/app-daily'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    maxSizeMB?: number
    previewUrl?: string
    usageType?: string
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
    if (u && !preview.value) {
      preview.value = u
    }
  }
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

  uploading.value = true
  try {
    const res = await uploadImage(raw, props.usageType)
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
  width: 120px;
  height: 120px;
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
  line-height: 22px;
  text-align: center;
  cursor: pointer;
}
</style>
