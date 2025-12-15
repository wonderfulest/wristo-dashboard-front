<template>
  <div class="avatar-upload">
    <el-upload
      class="avatar-uploader"
      :show-file-list="false"
      :http-request="doUpload"
      :before-upload="beforeUpload"
      accept="image/*"
      :disabled="uploading"
    >
      <div class="box">
        <img v-if="previewUrl" :src="previewUrl" class="avatar" />
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
import type { ImageVO } from '@/types/image'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    maxSizeMB?: number
  }>(),
  {
    maxSizeMB: 2
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'uploaded', v: ImageVO): void
}>()

const uploading = ref(false)
const preview = ref<string>('')

const previewUrl = computed(() => preview.value)

watch(
  () => props.modelValue,
  (v) => {
    preview.value = v || ''
  },
  { immediate: true }
)

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  const max = props.maxSizeMB ?? 2
  const sizeOk = file.size / 1024 / 1024 <= max
  if (!sizeOk) {
    ElMessage.error(`图片大小不能超过 ${max}MB!`)
    return false
  }
  return true
}

const uploadRawFile = async (raw: File) => {
  if (!beforeUpload(raw)) return

  uploading.value = true
  try {
    const res = await uploadImage(raw, 'avatar')
    const img = (res as any)?.data as ImageVO | undefined
    const url = img?.previewUrl || (img as any)?.formats?.thumbnail?.url || img?.url || ''
    if (!url) throw new Error('上传失败')

    preview.value = url
    emit('update:modelValue', url)
    if (img) emit('uploaded', img)
    ElMessage.success('头像上传成功')
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '头像上传失败')
  } finally {
    uploading.value = false
  }
}

const doUpload = async (options: any) => {
  const raw: File | null = options?.file || null
  if (!raw) return
  await uploadRawFile(raw)
}

const clear = () => {
  preview.value = ''
  emit('update:modelValue', '')
}
</script>

<style scoped>
.avatar-uploader {
  display: inline-flex;
}

.box {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #eee;
  background: #fafbfc;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  font-size: 32px;
  color: #bbb;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed #eee;
  border-radius: 50%;
}

.mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.clear {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.clear:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
