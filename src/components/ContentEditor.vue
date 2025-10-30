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
.we-editor { border: 1px solid #dcdfe6; border-radius: 0 0 6px 6px; }

/* Ensure toolbar full width and editor scrolling behavior */
:deep(.w-e-toolbar) { width: 100%; }
:deep(.w-e-text-container) {
  min-height: 420px;
  max-height: 560px;
  overflow-y: auto;
}
</style>
