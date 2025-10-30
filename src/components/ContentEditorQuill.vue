<template>
  <quill-editor
    v-model:value="content"
    :options="options"
    class="quill-editor"
  />
  <div class="quill-height-guard" />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { quillEditor } from 'vue3-quill'
import Quill from 'quill'
import QuillBetterTable from 'quill-better-table'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.core.css'
import 'quill-better-table/dist/quill-better-table.css'

defineOptions({
  components: { quillEditor }
})

const props = withDefaults(defineProps<{ modelValue: string; placeholder?: string }>(), {
  modelValue: '',
  placeholder: '在此输入正文…'
})
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const content = ref<string>(props.modelValue || '')

watch(content, (v) => emit('update:modelValue', v || ''))
watch(() => props.modelValue, (v) => {
  if ((v || '') !== (content.value || '')) content.value = v || ''
})

// Register quill-better-table module for Quill 1.x
Quill.register({ 'modules/better-table': QuillBetterTable }, true)

const options = computed(() => ({
  placeholder: props.placeholder,
  theme: 'snow',
  modules: {
    table: false,
    'better-table': {
      operationMenu: {
        insertRowUp: true,
        insertRowDown: true,
        insertColumnLeft: true,
        insertColumnRight: true,
        mergeCells: true,
        unmergeCells: true,
        deleteRow: true,
        deleteColumn: true,
        deleteTable: true
      }
    },
    keyboard: {
      bindings: (QuillBetterTable as any).keyboardBindings
    },
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean'],
        ['table']
      ],
      handlers: {
        table(this: any) {
          const table = this.quill.getModule('better-table')
          if (table && table.insertTable) {
            table.insertTable(2, 2)
          }
        }
      }
    }
  }
}))
</script>

<style scoped>
.quill-height-guard { height: 0; }
:deep(.ql-editor) { min-height: 420px; padding-bottom: 16px; }
:deep(.ql-container) { border-radius: 6px; }
</style>
