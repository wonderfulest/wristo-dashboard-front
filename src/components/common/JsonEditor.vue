<template>
  <div class="json-editor">
    <div class="editor-header">
      <span class="label">{{ label }}</span>
      <div class="actions">
        <el-button v-if="!readonly" size="small" @click="formatJson">格式化</el-button>
        <el-button v-if="!readonly" size="small" @click="validateJson">验证</el-button>
        <el-button v-if="readonly" size="small" @click="copyJson">复制</el-button>
      </div>
    </div>
    <el-input
      v-model="localValue"
      type="textarea"
      :rows="rows"
      :placeholder="placeholder"
      :readonly="readonly"
      :class="{ 'is-error': hasError, 'is-readonly': readonly }"
      @input="handleInput"
    />
    <div v-if="hasError" class="error-message">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ errorMessage }}</span>
    </div>
    <div v-if="showPreview && isValidJson" class="json-preview">
      <div class="preview-header">预览</div>
      <pre>{{ formattedPreview }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'


const validateJsonSilent = () => {
  if (!localValue.value || localValue.value.trim() === '') {
    hasError.value = false
    errorMessage.value = ''
    return true
  }
  try {
    JSON.parse(localValue.value)
    hasError.value = false
    errorMessage.value = ''
    return true
  } catch (e: any) {
    hasError.value = true
    errorMessage.value = e.message || 'JSON 格式错误'
    return false
  }
}
interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  rows?: number
  readonly?: boolean
  showPreview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: 'JSON 配置',
  placeholder: '请输入 JSON 格式数据，如: {"key": "value"}',
  rows: 6,
  readonly: false,
  showPreview: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const localValue = ref(props.modelValue || '')
const hasError = ref(false)
const errorMessage = ref('')

const autoFormatJson = (value: string) => {
  if (!value || value.trim() === '') {
    return value
  }
  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return value
  }
}

watch(() => props.modelValue, (newVal) => {
  const formatted = autoFormatJson(newVal || '')
  localValue.value = formatted
  validateJsonSilent()
  if (formatted !== newVal && formatted) {
    emit('update:modelValue', formatted)
  }
}, { immediate: true })

const isValidJson = computed(() => {
  if (!localValue.value || localValue.value.trim() === '') return true
  try {
    JSON.parse(localValue.value)
    return true
  } catch {
    return false
  }
})

const formattedPreview = computed(() => {
  if (!isValidJson.value) return ''
  try {
    return JSON.stringify(JSON.parse(localValue.value), null, 2)
  } catch {
    return ''
  }
})

const handleInput = () => {
  emit('update:modelValue', localValue.value)
  validateJsonSilent()
}


const validateJson = () => {
  if (!localValue.value || localValue.value.trim() === '') {
    ElMessage.success('JSON 为空，验证通过')
    return
  }
  try {
    JSON.parse(localValue.value)
    hasError.value = false
    errorMessage.value = ''
    ElMessage.success('JSON 格式正确')
  } catch (e: any) {
    hasError.value = true
    errorMessage.value = e.message || 'JSON 格式错误'
    ElMessage.error(`JSON 格式错误: ${e.message}`)
  }
}

const formatJson = () => {
  if (!localValue.value || localValue.value.trim() === '') {
    ElMessage.warning('请先输入 JSON 内容')
    return
  }
  try {
    const parsed = JSON.parse(localValue.value)
    localValue.value = JSON.stringify(parsed, null, 2)
    emit('update:modelValue', localValue.value)
    hasError.value = false
    errorMessage.value = ''
    ElMessage.success('格式化成功')
  } catch (e: any) {
    hasError.value = true
    errorMessage.value = e.message || 'JSON 格式错误'
    ElMessage.error(`格式化失败: ${e.message}`)
  }
}

const copyJson = () => {
  if (!localValue.value) {
    ElMessage.warning('没有内容可复制')
    return
  }
  navigator.clipboard.writeText(localValue.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<style scoped>
.json-editor {
  width: 100%;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.actions {
  display: flex;
  gap: 8px;
}

.json-editor :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.json-editor :deep(.el-textarea__inner.is-error) {
  border-color: #f56c6c;
}

.json-editor :deep(.el-textarea__inner.is-readonly) {
  background-color: #f5f7fa;
  cursor: default;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  color: #f56c6c;
  font-size: 13px;
}

.error-message .el-icon {
  font-size: 16px;
}

.json-preview {
  margin-top: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.preview-header {
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.json-preview pre {
  margin: 0;
  padding: 12px;
  background-color: #fafafa;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  color: #303133;
}
</style>
