<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadImage } from '@/api/image'

const props = withDefaults(defineProps<{ modelValue: string[]; limit?: number; maxSizeMB?: number; disabled?: boolean }>(), { limit: 5, maxSizeMB: 10, disabled: false })
const emit = defineEmits<{
  (e: 'update:modelValue', urls: string[]): void
  (e: 'uploading', value: boolean): void
}>()
const input = ref<HTMLInputElement>()
const uploading = ref(false)
async function upload(files: File[]) {
  if (uploading.value || props.disabled || !files.length) return
  if (props.modelValue.length + files.length > props.limit) {
    ElMessage.warning(`最多上传 ${props.limit} 张图片，还可添加 ${props.limit - props.modelValue.length} 张`)
    return
  }
  if (files.some(file => !file.type.startsWith('image/') || file.size > props.maxSizeMB * 1024 * 1024)) {
    ElMessage.error(`请选择图片文件，单张不超过 ${props.maxSizeMB}MB`)
    return
  }
  uploading.value = true
  emit('uploading', true)
  const urls = [...props.modelValue]
  try {
    for (const file of files) {
      try {
        const result = await uploadImage(file, 'general')
        const value = result.data?.url
        const url = new URL(value || '')
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error('无效的原图地址')
        urls.push(url.href)
        emit('update:modelValue', [...urls])
      } catch { ElMessage.error(`${file.name} 上传失败，请重试`) }
    }
  } finally { uploading.value = false; emit('uploading', false) }
}
function select(event: Event) {
  const element = event.target as HTMLInputElement
  const files = Array.from(element.files || [])
  element.value = ''
  void upload(files)
}
function drop(event: DragEvent) { void upload(Array.from(event.dataTransfer?.files || [])) }
function remove(index: number) {
  if (uploading.value || props.disabled) return
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}
</script>
<template>
  <div class="gallery-upload">
    <input ref="input" type="file" accept="image/*" multiple hidden @change="select" />
    <button type="button" class="upload-area" :disabled="uploading || disabled || modelValue.length >= limit" @click="input?.click()" @dragover.prevent @drop.prevent="drop">
      {{ uploading ? '上传中…' : modelValue.length >= limit ? `已上传 ${limit} 张图片` : '点击选择或拖入图片，可多选' }}
      <small>{{ modelValue.length }} / {{ limit }} · 单张不超过 {{ maxSizeMB }}MB</small>
    </button>
    <div v-if="modelValue.length" class="images">
      <div v-for="(url, index) in modelValue" :key="`${index}-${url}`" class="image-item">
        <el-image :src="url" fit="contain" :preview-src-list="modelValue" :initial-index="index" preview-teleported />
        <el-button size="small" :disabled="uploading || disabled" @click="remove(index)">移除</el-button>
        <slot name="actions" :url="url" :index="index" />
      </div>
    </div>
  </div>
</template>
<style scoped>
.gallery-upload{width:100%}.upload-area{width:100%;padding:24px;border:1px dashed #cbd5e1;border-radius:8px;background:#fafafa;color:#475569;cursor:pointer}.upload-area:disabled{cursor:default;opacity:.65}.upload-area small{display:block;margin-top:8px}.images{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;margin-top:16px}.image-item{display:flex;flex-direction:column;gap:8px;align-items:flex-start}.el-image{width:100%;height:130px;background:#f1f5f9;border-radius:8px}
</style>
