<template>
  <el-dialog
    v-model="visibleRef"
    title="上传 TTF 字体"
    width="480px"
    :close-on-click-modal="false"
    append-to-body
  >
    <div class="font-ttf-upload">
      <el-upload
        class="font-upload-area"
        drag
        accept=".ttf"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
      >
        <div class="upload-content">
          <el-icon class="upload-icon">
            <Upload />
          </el-icon>
          <div class="upload-text">
            <span>点击选择或拖拽 TTF 字体文件</span>
            <p class="upload-tip">仅支持 .ttf</p>
          </div>
        </div>
      </el-upload>

      <div v-if="selectedFile" class="file-info">
        <div class="file-row">
          <span class="file-name">{{ selectedFile.name }}</span>
          <el-button type="text" class="remove-btn" @click="removeFile">移除</el-button>
        </div>

        <div class="preview-section">
          <div class="preview-label">Preview:</div>
          <FontPreview
            :url="objectUrl"
            :name="parsedInfo?.fullName || selectedFile?.name || ''"
            full
            size="20px"
          />
        </div>

        <div class="preview-section">
          <div class="preview-label">Font type:</div>
          <el-radio-group
            v-model="selectedFontType"
            :disabled="loadingFontTypes || !fontTypeOptions.length"
          >
            <el-radio-button
              v-for="opt in fontTypeOptions"
              :key="opt.value"
              :label="opt.value"
            >
              {{ opt.name }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <div v-if="parsedInfo" class="font-meta">
          <div class="meta-title">字体信息</div>
          <ul class="meta-list">
            <li v-if="parsedInfo.fullName"><strong>名称：</strong>{{ parsedInfo.fullName }}</li>
            <li v-if="parsedInfo.family"><strong>字族：</strong>{{ parsedInfo.family }}</li>
            <li v-if="parsedInfo.version"><strong>版本：</strong>{{ parsedInfo.version }}</li>
            <li v-if="parsedInfo.postscriptName"><strong>PostScript：</strong>{{ parsedInfo.postscriptName }}</li>
            <li><strong>字形数：</strong>{{ parsedInfo.glyphCount }}</li>
            <li v-if="parsedInfo.languageCodes?.length"><strong>语言：</strong>{{ parsedInfo.languageCodes.join(', ') }}</li>
            <li v-if="parsedInfo.unitsPerEm"><strong>Units per EM：</strong>{{ parsedInfo.unitsPerEm }}</li>
            <li v-if="parsedInfo.isMonospace !== undefined"><strong>等宽：</strong>{{ parsedInfo.isMonospace ? '是' : '否' }}</li>
            <li v-if="parsedInfo.italic !== undefined"><strong>斜体：</strong>{{ parsedInfo.italic ? '是' : '否' }}</li>
          </ul>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :disabled="!selectedFile"
          :loading="uploading"
          @click="handleConfirm"
        >
          确认上传
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Upload } from '@element-plus/icons-vue'
import type { DesignFontVO } from '@/types/font'
import { uploadOnlyTtf } from '@/api/fonts'
import { ElMessage } from 'element-plus'
import opentype from 'opentype.js'
import type { EnumOption } from '@/api/common'
import { DESIGN_FONT_TYPE_ENUM_NAME, useEnumStore } from '@/store/common'
import FontPreview from './FontPreview.vue'

interface ParsedFontInfo {
  fullName?: string
  postscriptName?: string
  family?: string
  subfamily?: string
  version?: string
  copyright?: string
  glyphCount: number
  languageCodes: string[]
  isMonospace?: boolean
  italic?: boolean
  weightClass?: number
  widthClass?: number
  unitsPerEm?: number
  ascent?: number
  descent?: number
  lineGap?: number
  capHeight?: number
  xHeight?: number
}

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'success', v: DesignFontVO): void
}>()

const visibleRef = ref(props.visible)
watch(
  () => props.visible,
  (v) => {
    visibleRef.value = v
  },
)
watch(visibleRef, (v) => emit('update:visible', v))

const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const parsedInfo = ref<ParsedFontInfo | null>(null)
const fontTypeOptions = ref<EnumOption[]>([])
const loadingFontTypes = ref(false)
const selectedFontType = ref<string>('')
// Blob URL for local preview via FontPreview component
const objectUrl = ref<string>('')

const enumStore = useEnumStore()

onMounted(async () => {
  try {
    loadingFontTypes.value = true
    const list: EnumOption[] = await enumStore.getEnumOptions(DESIGN_FONT_TYPE_ENUM_NAME)
    fontTypeOptions.value = Array.isArray(list) && list.length
      ? list
      : [{ name: 'ratio', value: 'ratio' }]
    if (!selectedFontType.value && fontTypeOptions.value.length) {
      selectedFontType.value = fontTypeOptions.value[0].value
    }
  } catch {
    fontTypeOptions.value = [{ name: 'ratio', value: 'ratio' }]
  } finally {
    loadingFontTypes.value = false
  }
})

const handleFileChange = (file: any) => {
  if (!file) return
  const raw: File | undefined = file.raw
  if (!raw) return
  const lower = (raw.name || '').toLowerCase()
  const isTTF = lower.endsWith('.ttf')
  if (!isTTF) {
    ElMessage.error('仅支持 TTF 文件')
    return
  }
  selectedFile.value = raw
  // manage object URL
  if (objectUrl.value) {
    try { URL.revokeObjectURL(objectUrl.value) } catch {}
  }
  objectUrl.value = URL.createObjectURL(raw)

  // 解析字体信息
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const arrayBuffer = reader.result as ArrayBuffer
      const font: any = opentype.parse(arrayBuffer)
      const names: any = font?.names
      const tables: any = (font as any)?.tables || {}
      const os2 = tables.os2 || tables.OS_2
      const post = tables.post

      const langSet = new Set<string>()
      const collectLangs = (rec: Record<string, unknown> | undefined) => {
        if (!rec) return
        Object.keys(rec).forEach((k) => {
          if (k.length >= 2 && k.length <= 8) langSet.add(k)
        })
      }
      collectLangs(names?.fullName as any)
      collectLangs(names?.fontFamily as any)
      collectLangs(names?.fontSubfamily as any)
      collectLangs(names?.version as any)

      const subfamilyStr = names?.fontSubfamily?.en || names?.fontSubfamily?.enUS || names?.fontSubfamily?.enGB || ''

      const info: ParsedFontInfo = {
        fullName: names?.fullName?.en || names?.fullName?.enUS || names?.fullName?.enGB,
        postscriptName: names?.postScriptName?.en || names?.postScriptName?.enUS || names?.postScriptName?.enGB,
        family: names?.fontFamily?.en || names?.fontFamily?.enUS || names?.fontFamily?.enGB || raw.name.replace(/\.ttf$/i, ''),
        subfamily: subfamilyStr,
        version: names?.version?.en || names?.version?.enUS || names?.version?.enGB,
        copyright: names?.copyright?.en || names?.copyright?.enUS || names?.copyright?.enGB,
        glyphCount: font?.glyphs?.length ?? 0,
        languageCodes: Array.from(langSet),
        isMonospace: !!post?.isFixedPitch,
        italic: typeof os2?.fsSelection === 'number' ? Boolean(os2.fsSelection & 0x01) : /italic/i.test(subfamilyStr),
        weightClass: os2?.usWeightClass,
        widthClass: os2?.usWidthClass,
        unitsPerEm: (font as any)?.unitsPerEm,
        ascent: (font as any)?.tables?.hhea?.ascent ?? (font as any)?.ascender,
        descent: (font as any)?.tables?.hhea?.descent ?? (font as any)?.descender,
        lineGap: (font as any)?.tables?.hhea?.lineGap,
        capHeight: os2?.sCapHeight,
        xHeight: os2?.sxHeight,
      }

      parsedInfo.value = info
    } catch (err) {
      parsedInfo.value = null
      ElMessage.error('字体解析失败')
    }
  }
  reader.onerror = () => {
    parsedInfo.value = null
    ElMessage.error('字体文件读取失败')
  }
  reader.readAsArrayBuffer(raw)
}

const removeFile = () => {
  selectedFile.value = null
  parsedInfo.value = null
  if (objectUrl.value) {
    try { URL.revokeObjectURL(objectUrl.value) } catch {}
    objectUrl.value = ''
  }
}

const resetState = () => {
  selectedFile.value = null
  uploading.value = false
  parsedInfo.value = null
  if (objectUrl.value) {
    try { URL.revokeObjectURL(objectUrl.value) } catch {}
    objectUrl.value = ''
  }
}

const handleCancel = () => {
  visibleRef.value = false
  resetState()
}

const handleConfirm = async () => {
  if (!selectedFile.value) {
    ElMessage.error('请先选择 TTF 文件')
    return
  }
  if (!selectedFontType.value) {
    ElMessage.error('请先选择字体类型')
    return
  }
  try {
    uploading.value = true
    const resp = await uploadOnlyTtf(selectedFile.value, selectedFontType.value)
    const data = (resp as any).data?.data || (resp as any).data
    if (!data) {
      ElMessage.error('上传失败')
      return
    }
    ElMessage.success('上传成功，待审核')
    emit('success', data as DesignFontVO)
    visibleRef.value = false
    resetState()
  } catch (e: any) {
    const msg = e?.response?.data?.message || '上传失败'
    ElMessage.error(msg)
  } finally {
    uploading.value = false
  }
}

onUnmounted(() => {
  if (objectUrl.value) {
    try { URL.revokeObjectURL(objectUrl.value) } catch {}
    objectUrl.value = ''
  }
})
</script>

<style scoped>
.font-ttf-upload {
  padding: 8px 4px;
}

.font-upload-area {
  width: 100%;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 12px;
}

.upload-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 8px;
}

.upload-text {
  text-align: center;
}

.upload-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.file-info {
  margin-top: 16px;
}

.file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.file-name {
  font-size: 14px;
  color: #606266;
}

.remove-btn {
  padding: 0;
}
</style>
