<template>
  <div class="file-upload">
    <el-upload
      class="upload"
      :show-file-list="false"
      :http-request="doUpload"
      :before-upload="beforeUpload"
      :accept="accept"
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
        <div v-if="modelValue" class="file-info">
          <div class="file-name" :title="fileName">{{ fileName || '文件已上传' }}</div>
          <div class="file-id">ID: {{ modelValue }}</div>
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
import { uploadAdminFile } from '@/api/files'
import type { FileVO } from '@/types/font-glyph'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    usageType: string
    accept?: string
    maxSizeMB?: number
    fileName?: string
  }>(),
  {
    accept: '*',
    maxSizeMB: 50,
    fileName: ''
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', v?: number): void
  (e: 'uploaded', v: FileVO): void
}>()

const uploading = ref(false)
const uploadedName = ref<string>('')
const dragOver = ref(false)

const fileName = computed(() => {
  return props.fileName || uploadedName.value
})

watch(
  () => props.modelValue,
  (v) => {
    if (!v) {
      uploadedName.value = ''
    }
  }
)

const beforeUpload = (file: File) => {
  const max = props.maxSizeMB || 50
  const sizeOk = file.size / 1024 / 1024 <= max
  if (!sizeOk) {
    ElMessage.error(`文件大小不能超过 ${max}MB`)
    return false
  }
  if (!props.usageType) {
    ElMessage.error('缺少 usageType')
    return false
  }
  return true
}

const uploadRawFile = async (raw: File) => {
  if (!beforeUpload(raw)) return

  uploading.value = true
  try {
    const res = await uploadAdminFile(raw, props.usageType)
    const f = (res as any)?.data as FileVO | undefined
    if (!f?.id) {
      throw new Error('上传失败')
    }
    emit('update:modelValue', f.id)
    uploadedName.value = f.name || raw.name
    emit('uploaded', f)
    ElMessage.success('文件已上传')
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
  uploadedName.value = ''
}
</script>

<style scoped>
.file-upload { display: inline-flex; }
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
  padding: 10px;
  box-sizing: border-box;
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
.file-info {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}
.file-name {
  font-size: 12px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.3;
}
.file-id {
  font-size: 12px;
  color: #909399;
}
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
