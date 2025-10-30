<template>
  <div class="we-wrapper">
    <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" mode="default" class="we-toolbar" />
    <Editor
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      mode="default"
      @onCreated="handleCreated"
      @onChange="handleChange"
      class="we-editor"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch, onBeforeUnmount } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { uploadImage } from '@/api/image'

const props = withDefaults(defineProps<{ modelValue: string; placeholder?: string }>(), {
  modelValue: '',
  placeholder: '在此输入正文…'
})
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const editorRef = shallowRef<any>()
const valueHtml = ref<string>(props.modelValue || '')

const toolbarConfig = ref<Record<string, any>>({})
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
    }
  }
})

const handleCreated = (editor: any) => {
  editorRef.value = editor
}

const handleChange = () => {
  emit('update:modelValue', valueHtml.value || '')
}

watch(() => props.modelValue, (v) => {
  if ((v || '') !== (valueHtml.value || '')) valueHtml.value = v || ''
})

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
</script>

<style scoped>
.we-wrapper { display: flex; flex-direction: column; gap: 0; width: 100%; }
.we-toolbar { border: 1px solid #dcdfe6; border-bottom: none; border-radius: 6px 6px 0 0; }
.we-editor { border: 1px solid #dcdfe6; border-radius: 0 0 6px 6px; overflow: hidden; }

/* Avoid clipping floating toolbars/menus */
.we-wrapper { overflow: visible; }

/* Ensure toolbar full width and editor scrolling behavior */
:deep(.w-e-toolbar) { width: 100%; }
:deep(.w-e-text-container) {
  min-height: 420px;
  /* overflow on scroll node to avoid position drift */
  overflow: visible;
  position: relative;
}
:deep(.w-e-scroll) {
  min-height: 420px;
  max-height: 560px;
  overflow-y: auto;
}

/* Raise z-index for WangEditor floating UI so it stays above tables/modals */
:deep(.w-e-tooltip),
:deep(.w-e-modal),
:deep(.w-e-panel),
:deep(.w-e-drop-panel),
:deep(.w-e-hover-bar) {
  z-index: 3001;
}
</style>
