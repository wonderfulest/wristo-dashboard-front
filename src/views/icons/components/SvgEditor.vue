<template>
  <el-dialog v-model="visibleInner" title="编辑 SVG" width="70%" :close-on-click-modal="false" @closed="onClosed">
    <div class="edit-wrap">
      <div class="editor-side">
        <el-input
          v-model="editSvgContent"
          type="textarea"
          :rows="18"
          placeholder="粘贴或编辑 SVG 内容"
        />
        <div class="edit-actions">
          <el-button @click="autoCropAndCenter" :disabled="!editSvgContent">自动裁剪居中</el-button>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
          <el-button @click="visibleInner = false">取消</el-button>
        </div>
      </div>
      <div class="preview-side">
        <div class="preview-box" v-html="editSvgContent"></div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getIconAssetDetail, cropIconSvg } from '@/api/icon-asset'

interface Props {
  modelValue: boolean
  assetId: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved'): void
}>()

const visibleInner = ref(false)
const saving = ref(false)
const editSvgContent = ref('')

watch(() => props.modelValue, v => {
  visibleInner.value = v
})
watch(visibleInner, v => emit('update:modelValue', v))

watch(() => props.assetId, async (id) => {
  if (!visibleInner.value || !id) return
  await loadDetail(id)
})

watch(visibleInner, async (v) => {
  if (v && props.assetId) {
    await loadDetail(props.assetId)
  }
})

async function loadDetail(id: number) {
  editSvgContent.value = ''
  try {
    const resp = await getIconAssetDetail(id, { populate: 'svg_content' })
    const data: any = (resp as any)?.data
    if (data && typeof data.svgContent === 'string') {
      editSvgContent.value = data.svgContent
    }
  } catch (e) {
    ElMessage.error('获取SVG内容失败')
  }
}

function onClosed() {
  editSvgContent.value = ''
}

async function save() {
  if (!props.assetId) return
  saving.value = true
  try {
    await cropIconSvg({ id: props.assetId, svgContent: editSvgContent.value })
    ElMessage.success('保存成功')
    visibleInner.value = false
    emit('saved')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const autoCropAndCenter = () => {
  const src = editSvgContent.value?.trim()
  if (!src) return
  try {
    const cropped = cropSvgToContentBBox(src)
    if (cropped) {
      editSvgContent.value = cropped
      ElMessage.success('已裁剪并居中')
    } else {
      ElMessage.warning('无法计算边界')
    }
  } catch (e) {
    ElMessage.error('处理失败')
  }
}

function cropSvgToContentBBox(svgText: string): string | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = doc.documentElement as unknown as SVGSVGElement
  if (!svg || svg.tagName.toLowerCase() !== 'svg') return null

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '-10000px'
  container.style.opacity = '0'
  container.style.pointerEvents = 'none'
  document.body.appendChild(container)

  const measureSvg = svg.cloneNode(true) as SVGSVGElement
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  const children: ChildNode[] = []
  while (measureSvg.firstChild) {
    children.push(measureSvg.firstChild)
    measureSvg.removeChild(measureSvg.firstChild)
  }
  children.forEach((n) => {
    if ((n as Element).nodeType === 1 && (n as Element).nodeName.toLowerCase() === 'defs') {
      measureSvg.appendChild(n)
    } else {
      g.appendChild(n)
    }
  })
  measureSvg.appendChild(g)
  measureSvg.setAttribute('width', '1000')
  measureSvg.setAttribute('height', '1000')
  if (!measureSvg.getAttribute('viewBox')) measureSvg.setAttribute('viewBox', '0 0 1000 1000')
  container.appendChild(measureSvg)

  let bbox: DOMRect
  try {
    bbox = (g as any).getBBox()
  } catch (e) {
    document.body.removeChild(container)
    return null
  }
  document.body.removeChild(container)
  if (!bbox || !isFinite(bbox.width) || !isFinite(bbox.height) || bbox.width <= 0 || bbox.height <= 0) return null

  // Make square viewBox centered at content
  const cx = bbox.x + bbox.width / 2
  const cy = bbox.y + bbox.height / 2
  const side = Math.max(bbox.width, bbox.height)
  const vx = cx - side / 2
  const vy = cy - side / 2
  svg.setAttribute('viewBox', `${vx} ${vy} ${side} ${side}`)
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

  const serializer = new XMLSerializer()
  return serializer.serializeToString(svg)
}
</script>

<style scoped>
.edit-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.editor-side { display: flex; flex-direction: column; gap: 12px; }
.preview-side { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; padding: 12px; }
.preview-box { background: #fff; min-height: 340px; display: flex; align-items: center; justify-content: center; }
.edit-actions { display: flex; gap: 8px; }
</style>
