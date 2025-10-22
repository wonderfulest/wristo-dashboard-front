<template>
  <div class="upload-wrap">
    <el-upload
      :show-file-list="false"
      :before-upload="beforeUpload"
      :http-request="doUpload"
      accept=".svg"
      multiple
    >
      <el-button type="success" :loading="uploading">上传SVG</el-button>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { uploadIconSvgWithProgress } from '@/api/icon-asset'

interface Props {
  symbolCode?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:symbolCode', v: string | undefined): void
  (e: 'uploaded'): void
}>()

const uploading = ref(false)
const activeUploads = ref(0)
let loadingInstance: ReturnType<typeof ElLoading.service> | null = null

const beforeUpload = (file: File) => {
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
  if (!isSvg) {
    ElMessage.error('请上传 SVG 文件')
    return false
  }
  return true
}

const doUpload = async (options: { file: File }) => {
  const file = options.file
  if (!beforeUpload(file)) return
  startLoading(`正在上传 ${file.name} ...`)
  try {
    await uploadIconSvgWithProgress(file, props.symbolCode, (evt: any) => {
      const total = evt?.total || 0
      if (total && loadingInstance) {
        const percent = Math.min(100, Math.round((evt.loaded / total) * 100))
        loadingInstance.setText(`正在上传 ${file.name} ... ${percent}%`)
      }
    })
    stopLoading()
    ElMessage.success(`${file.name} 上传成功`)
    emit('uploaded')
  } catch (e) {
    stopLoading()
    ElMessage.error(`${file.name} 上传失败`)
  } finally {
    // no-op
  }
}

function startLoading(text: string) {
  activeUploads.value += 1
  if (!loadingInstance) {
    loadingInstance = ElLoading.service({ text })
  } else {
    loadingInstance.setText(text)
  }
  uploading.value = activeUploads.value > 0
}

function stopLoading() {
  activeUploads.value = Math.max(0, activeUploads.value - 1)
  if (activeUploads.value === 0 && loadingInstance) {
    loadingInstance.close()
    loadingInstance = null
  }
  uploading.value = activeUploads.value > 0
}
</script>

<style scoped>
.upload-wrap { display: flex; flex-direction: column; gap: 8px; }
</style>
