<template>
  <component :is="CKEditorComponent" :editor="editor" v-model="content" :config="config" />
  <div class="ck-height-guard" />
  
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import CKEditor from '@ckeditor/ckeditor5-vue'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'

const props = withDefaults(defineProps<{ modelValue: string; placeholder?: string }>(), {
  modelValue: '',
  placeholder: '在此输入正文…'
})
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const content = ref<string>(props.modelValue || '')

const editor = ClassicEditor
const CKEditorComponent = (CKEditor as any).component

const config = computed(() => ({
  placeholder: props.placeholder,
  toolbar: {
    items: [
      'heading',
      '|',
      'bold', 'italic', 'underline', 'link',
      '|',
      'bulletedList', 'numberedList', 'blockQuote',
      '|',
      'alignment',
      '|',
      'undo', 'redo'
    ],
    shouldNotGroupWhenFull: true
  }
}))

watch(content, (v) => emit('update:modelValue', v || ''))
watch(() => props.modelValue, (v) => {
  if ((v || '') !== (content.value || '')) content.value = v || ''
})
</script>

<style scoped>
.ck-height-guard { height: 0; }
:deep(.ck.ck-editor__editable),
:deep(.ck.ck-editor__editable_inline),
:deep(.ck-content) { min-height: 420px; padding-bottom: 16px; }
</style>
