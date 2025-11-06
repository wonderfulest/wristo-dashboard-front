<template>
  <div class="upload-wrap">
    <el-button type="success" :loading="uploading" @click="dialogVisible = true">上传SVG</el-button>

    <el-dialog v-model="dialogVisible" title="上传 SVG" width="860px" :close-on-click-modal="false">
      <el-upload
        drag
        :show-file-list="false"
        :before-upload="beforeUpload"
        :http-request="doUpload"
        accept=".svg"
        multiple
        :disabled="uploading"
      >
        <div class="el-upload__text">
          <div>将 SVG 拖拽到此处，或点击选择，支持多文件</div>
          <div>1. 支持选择上传的图标，只能同时上传一种类型的图标</div>
          <div>2. 如果不选择，则上传文件名需要与 icon 的 Symbol Code 保持一致，比如 heart_rate.svg，可以同时上传多种类型的图标</div>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            <div class="symbol-quick">
              <div class="label">Symbol Code 速查表</div>
              <div class="symbol-selected">
                <span>已选择图标类型：</span>
                <span class="code" v-if="selectedSymbolCode">{{ selectedSymbolCode }}</span>
                <span v-else>未选择</span>
                <el-button v-if="selectedSymbolCode" link type="primary" @click="clearSelect" :disabled="uploading">清除选择</el-button>
              </div>
              <div class="symbol-grid">
                <div
                  v-for="it in iconList"
                  :key="it.symbolCode"
                  class="symbol-card"
                  :class="{ active: selectedSymbolCode === it.symbolCode }"
                  @click="toggleSelect(it.symbolCode)"
                >
                  <div class="symbol-code">{{ it.symbolCode }}</div>
                  <div class="symbol-label">{{ it.label }}</div>
                  <div class="symbol-code">{{ it.iconUnicode }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" :disabled="uploading">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { uploadIconSvg } from '@/api/icon-asset'
import { listIconLibrary } from '@/api/icon-library'

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
const dialogVisible = ref(false)
const iconList = ref<{ symbolCode: string; label: string; iconUnicode: string }[]>([])
const selectedSymbolCode = ref<string | undefined>(props.symbolCode)

watch(
  () => props.symbolCode,
  (v) => {
    selectedSymbolCode.value = v
  }
)

watch(
  () => selectedSymbolCode.value,
  (v) => {
    emit('update:symbolCode', v)
  }
)

watch(dialogVisible, async (v) => {
  if (v && iconList.value.length === 0) {
    try {
      const resp = (await listIconLibrary()) as any
      const arr = (resp?.data || [])
        .map((it: any) => ({ symbolCode: it?.symbolCode, label: it?.label, iconUnicode: it?.iconUnicode }))
        .filter((it: any) => !!it.symbolCode)
      iconList.value = arr
    } catch {
      // silent
    }
  }
})

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
    // Determine unicode: prefer selected icon; otherwise infer from file name by matching symbolCode
    const baseName = file.name.replace(/\.svg$/i, '')
    let unicode = ''
    if (selectedSymbolCode.value) {
      const found = iconList.value.find(it => it.symbolCode === selectedSymbolCode.value)
      unicode = found?.iconUnicode || ''
    } else {
      const foundByName = iconList.value.find(it => it.symbolCode === baseName)
      unicode = foundByName?.iconUnicode || ''
    }
    if (!unicode) {
      throw new Error('未能确定上传图标的 unicode，请在上方选择图标类型，或确保文件名与 Symbol Code 一致')
    }

    await uploadIconSvg(file, unicode, (evt: any) => {
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
    await ElMessageBox.alert(`${file.name} 上传失败`, '上传失败', {
      type: 'error',
      confirmButtonText: '确定'
    })
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

function toggleSelect(code?: string) {
  if (uploading.value) return
  if (!code) {
    selectedSymbolCode.value = undefined
    return
  }
  selectedSymbolCode.value = selectedSymbolCode.value === code ? undefined : code
}

function clearSelect() {
  if (uploading.value) return
  selectedSymbolCode.value = undefined
}
</script>

<style scoped>
.upload-wrap { display: flex; flex-direction: column; gap: 8px; }
.symbol-quick { margin-top: 8px; }
.symbol-quick .label { font-size: 12px; color: #909399; margin-bottom: 6px; }
.symbol-table { max-height: 220px; overflow: auto; width: 100%; }
.symbol-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.symbol-card { border: 1px solid #ebeef5; border-radius: 6px; padding: 8px 10px; background: #f9fafc; cursor: pointer; }
.symbol-card.active { border-color: #409eff; box-shadow: 0 0 0 1px #409eff inset; }
.symbol-code { font-weight: 600; color: #303133; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.symbol-label { font-size: 12px; color: #909399; margin-top: 4px; }
.symbol-selected { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px; color: #606266; }
.symbol-selected .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-weight: 600; color: #303133; }
</style>
