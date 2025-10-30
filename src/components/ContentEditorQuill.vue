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

// Polyfill: vue3-quill calls quill.pasteHTML (Quill v1 API). Quill v2 uses clipboard.dangerouslyPasteHTML.
// Provide a compatibility method on the prototype to avoid runtime errors.
const QAny = Quill as any
if (QAny && QAny.prototype && typeof QAny.prototype.pasteHTML !== 'function') {
  QAny.prototype.pasteHTML = function(indexOrHtml: any, html?: any, source?: any) {
    if (typeof indexOrHtml === 'number') {
      return this.clipboard.dangerouslyPasteHTML(indexOrHtml, html, source)
    }
    // If only HTML is provided, paste at current selection/index
    return this.clipboard.dangerouslyPasteHTML(indexOrHtml, html)
  }
}

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

/* Ensure toolbar on top, editor below - enforce vertical layout */
.quill-editor {
  display: flex !important;
  flex-direction: column !important;
  width: 100%;
}

.quill-editor :deep(.ql-toolbar) {
  order: 0 !important;
  flex-shrink: 0;
  border-bottom: 1px solid #ccc;
  width: 100% !important;
}

.quill-editor :deep(.ql-container) {
  order: 1 !important;
  flex: 1;
  border-top: none;
  border-radius: 0 0 6px 6px;
}

.quill-editor :deep(.ql-editor) {
  min-height: 420px;
  max-height: 560px;
  overflow-y: auto;
  padding-bottom: 16px;
  box-sizing: border-box;
}
</style>
<style>
.ql-toolbar.ql-snow {
  width: 100% !important;
}
</style>
