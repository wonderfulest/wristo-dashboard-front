<template>
  <div class="svg-upload">
    <template v-if="!disabled">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
        :accept="accept"
      >
        <el-button type="primary">
          {{ previewUrl ? '重新选择' : '选择文件' }}
        </el-button>
      </el-upload>
      <span v-if="previewUrl" class="preview-box">
        <el-image
          :src="previewUrl"
          fit="contain"
          class="preview-img"
        />
        <el-button
          v-if="clearable"
          type="danger"
          link
          size="small"
          class="clear-btn"
          @click="handleClear"
        >
          清除
        </el-button>
      </span>
    </template>
    <template v-else>
      <el-image
        v-if="previewUrl"
        :src="previewUrl"
        fit="contain"
        class="preview-img"
        :preview-src-list="[previewUrl]"
      />
      <span v-else class="no-file">无文件</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UploadFile } from 'element-plus'

interface Props {
  /** 预览URL */
  fileUrl?: string
  /** 接受的文件类型 */
  accept?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 是否禁用（只显示模式） */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fileUrl: '',
  accept: 'image/*,.svg',
  clearable: true,
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:fileUrl', value: string): void
  (e: 'change', file: File | null): void
}>()

const uploadRef = ref()
const previewUrl = ref(props.fileUrl || '')
const selectedFile = ref<File | null>(null)

// Sync with prop
watch(() => props.fileUrl, (val) => {
  previewUrl.value = val || ''
})

const handleFileChange = (file: UploadFile) => {
  if (!file.raw) return
  selectedFile.value = file.raw
  // 本地预览
  previewUrl.value = URL.createObjectURL(file.raw)
  emit('change', file.raw)
}

const handleClear = () => {
  selectedFile.value = null
  previewUrl.value = ''
  emit('update:fileUrl', '')
  emit('change', null)
}

// 暴露方法给父组件
defineExpose({
  getFile: () => selectedFile.value,
  clear: handleClear
})
</script>

<style scoped>
.svg-upload {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-img {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.clear-btn {
  padding: 0;
}

.no-file {
  color: #909399;
  font-size: 14px;
}
</style>
