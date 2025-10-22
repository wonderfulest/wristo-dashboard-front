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

    <div class="uploads" v-if="items.length">
      <div class="upload-item" v-for="u in items" :key="u.id">
        <span class="name">{{ u.name }}</span>
        <el-progress :percentage="u.progress" :status="u.status === 'error' ? 'exception' : (u.status === 'success' ? 'success' : undefined)" style="flex:1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
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

type UploadStatus = 'uploading' | 'success' | 'error'
interface UploadItem { id: string; name: string; progress: number; status: UploadStatus }
const items = ref<UploadItem[]>([])

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
  const item: UploadItem = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    progress: 0,
    status: 'uploading'
  }
  items.value.unshift(item)
  setUploadingFlag()
  try {
    await uploadIconSvgWithProgress(file, props.symbolCode, (evt: any) => {
      const total = evt?.total || 0
      if (total) {
        item.progress = Math.min(100, Math.round((evt.loaded / total) * 100))
      }
    })
    item.progress = 100
    item.status = 'success'
    ElMessage.success(`${file.name} 上传成功`)
    emit('uploaded')
  } catch (e) {
    item.status = 'error'
    ElMessage.error(`${file.name} 上传失败`)
  } finally {
    setUploadingFlag()
  }
}

function setUploadingFlag() {
  uploading.value = items.value.some(i => i.status === 'uploading')
}
</script>

<style scoped>
.upload-wrap { display: flex; flex-direction: column; gap: 8px; }
.uploads { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow: auto; }
.upload-item { display: flex; align-items: center; gap: 12px; }
.name { width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
