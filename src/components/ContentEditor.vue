<template>
  <div class="we-wrapper">
    <div class="we-actions">
      <el-button size="small" @click="toggleMode">
        {{ isSourceMode ? '返回富文本' : '源码编辑' }}
      </el-button>
    </div>
    <Toolbar v-show="!isSourceMode" :editor="editorRef" :defaultConfig="toolbarConfig" mode="default" class="we-toolbar" />
    <Editor
      v-show="!isSourceMode"
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      mode="default"
      @onCreated="handleCreated"
      @onChange="handleChange"
      @onFocus="handleFocus"
      @onBlur="handleBlur"
      class="we-editor"
    />
    <textarea
      v-show="isSourceMode"
      v-model="sourceHtml"
      class="we-source"
      spellcheck="false"
      placeholder="直接编辑 HTML 源码…"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch, onBeforeUnmount } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { uploadImage, uploadVideo } from '@/api/image'

const props = withDefaults(defineProps<{ modelValue: string; placeholder?: string }>(), {
  modelValue: '',
  placeholder: '在此输入正文…'
})
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const editorRef = shallowRef<any>()
const valueHtml = ref<string>(props.modelValue || '')
const isSourceMode = ref(false)
const sourceHtml = ref<string>(props.modelValue || '')

const toolbarConfig = ref<Record<string, any>>({
  excludeKeys: ['fullScreen']
})
const editorConfig = ref<Record<string, any>>({
  placeholder: props.placeholder,
  MENU_CONF: {
    uploadImage: {
      customUpload: async (file: File, insertFn: (url: string, alt?: string, href?: string) => void) => {
        const res = await uploadImage(file)
        const img = res.data
        const url = img?.url || ''
        const alt = img?.alternativeText || img?.name || ''
        insertFn(url, alt, url)
      }
    },
    uploadVideo: {
      customUpload: async (file: File, insertFn: (url: string, alt?: string, href?: string) => void) => {
        const res = await uploadVideo(file)
        const video = res.data
        const url = video?.url || ''
        const alt = video?.alternativeText || video?.name || ''
        insertFn(url, alt, url)
      }
    }
  }
})

const handleFocus = () => {
  // 聚焦时也检查内容是否有变化
  const editor = editorRef.value
  if (editor && !editor.isDestroyed && typeof editor.getHtml === 'function') {
    try {
      const currentHtml = editor.getHtml()
      if (currentHtml !== valueHtml.value) {
        valueHtml.value = currentHtml
        emit('update:modelValue', currentHtml)
      }
    } catch (e) {
      console.error('Failed to sync on focus:', e)
    }
  }
}

// While in source mode, keep valueHtml in sync and emit updates so parent gets latest HTML
watch(sourceHtml, (v) => {
  if (isSourceMode.value) {
    valueHtml.value = v || ''
    emit('update:modelValue', valueHtml.value)
  }
})

const handleBlur = () => {
  // 失焦时强制同步内容，确保工具栏操作的结果被保存
  const editor = editorRef.value
  if (editor && !editor.isDestroyed && typeof editor.getHtml === 'function') {
    try {
      const currentHtml = editor.getHtml()
      if (currentHtml !== valueHtml.value) {
        valueHtml.value = currentHtml
        emit('update:modelValue', currentHtml)
      }
    } catch (e) {
      console.warn('Failed to get editor content on blur:', e)
    }
  }
}
const handleCreated = (editor: any) => {
  editorRef.value = editor
}

const handleChange = () => {
  emit('update:modelValue', valueHtml.value || '')
  // keep source in sync while editing rich text
  if (!isSourceMode.value) sourceHtml.value = valueHtml.value || ''
}

watch(() => props.modelValue, (v) => {
  if ((v || '') !== (valueHtml.value || '')) valueHtml.value = v || ''
  if (!isSourceMode.value) sourceHtml.value = v || ''
})

// Toggle between rich text and source code modes
const toggleMode = () => {
  try {
    if (!isSourceMode.value) {
      // going into source mode: capture current html from editor
      const editor = editorRef.value
      if (editor && !editor.isDestroyed && typeof editor.getHtml === 'function') {
        const currentHtml = editor.getHtml()
        sourceHtml.value = currentHtml
      } else {
        sourceHtml.value = valueHtml.value || ''
      }
    } else {
      // returning to rich mode: set html back to editor
      const html = sourceHtml.value || ''
      valueHtml.value = html
      const editor = editorRef.value
      if (editor && !editor.isDestroyed && typeof editor.setHtml === 'function') {
        editor.setHtml(html)
      }
      emit('update:modelValue', html)
    }
  } finally {
    isSourceMode.value = !isSourceMode.value
  }
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null || editor.isDestroyed) return
  try {
    editor.destroy()
  } catch (e) {
    console.warn('Failed to destroy editor:', e)
  }
  editorRef.value = null
})
</script>

<style scoped>
.we-wrapper { display: flex; flex-direction: column; gap: 0; width: 100%; }
.we-actions { display: flex; justify-content: flex-end; margin-bottom: 6px; }
.we-toolbar { border: 1px solid #dcdfe6; border-bottom: none; border-radius: 6px 6px 0 0; }
.we-editor { border: 1px solid #dcdfe6; border-radius: 0 0 6px 6px; overflow: hidden; }

.we-source {
  width: 100%;
  min-height: 620px;
  max-height: 660px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #303133;
  background: #fff;
  resize: vertical;
}

/* Avoid clipping floating toolbars/menus */
.we-wrapper { overflow: visible; }

/* Ensure toolbar full width and editor scrolling behavior */
:deep(.w-e-toolbar) { width: 100%; }
:deep(.w-e-text-container) {
  min-height: 620px;
  /* overflow on scroll node to avoid position drift */
  overflow: visible;
  position: relative;
}
:deep(.w-e-scroll) {
  min-height: 620px;
  max-height: 660px;
  overflow-y: auto;
}

</style>
