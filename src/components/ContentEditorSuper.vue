<template>
  <div ref="host" class="ck-editor-host"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = withDefaults(defineProps<{ modelValue: string; placeholder?: string; licenseKey?: string }>(), {
  modelValue: '',
  placeholder: '在此输入正文…',
  licenseKey: 'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3OTMzMTgzOTksImp0aSI6ImVmODc3ZDYzLWU1OTAtNGQ3MC05ZGI2LWU0ZTAyOTUzNjY1YyIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiXSwiZmVhdHVyZXMiOlsiRFJVUCIsIkUyUCIsIkUyVyJdLCJyZW1vdmVGZWF0dXJlcyI6WyJQQiIsIlJGIiwiU0NIIiwiVENQIiwiVEwiLCJUQ1IiLCJJUiIsIlNVQSIsIkI2NEEiLCJMUCIsIkhFIiwiUkVEIiwiUEZPIiwiV0MiLCJGQVIiLCJCS00iLCJGUEgiLCJNUkUiXSwidmMiOiI5MTczYzM0NCJ9.i3DHlV9dy4iaRV-4HN7LjquErU64LQo8sHzd56x0hdvOigRIQapYHl5a2enotJIQcyYS0eCLyYxhMkFhCAdfWQ'
})
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const host = ref<HTMLElement | null>(null)
let editor: any = null

const ensureCk = () =>
  new Promise<void>((resolve, reject) => {
    // @ts-ignore
    const w: any = window as any
    if (w?.CKEDITOR?.ClassicEditor || w?.ClassicEditor) return resolve()
    const id = 'ck5-super-build'
    const exist = document.getElementById(id) as HTMLScriptElement | null
    if (exist) {
      exist.addEventListener('load', () => resolve())
      exist.addEventListener('error', (e) => reject(e))
      return
    }
    const s = document.createElement('script')
    s.id = id
    s.src = 'https://cdn.ckeditor.com/ckeditor5/41.4.2/super-build/ckeditor.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = (e) => reject(e)
    document.head.appendChild(s)
  })

const create = async () => {
  await nextTick()
  await ensureCk()
  if (!host.value) return
  // @ts-ignore
  const w: any = window as any
  const ClassicEditor = w?.CKEDITOR?.ClassicEditor || w?.ClassicEditor
  editor = await ClassicEditor.create(host.value, {
    placeholder: props.placeholder,
    toolbar: {
      items: [
        'heading',
        '|',
        'bold', 'italic', 'underline', 'strikethrough', 'code', 'subscript', 'superscript', 'removeFormat',
        '|',
        'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor',
        '|',
        'alignment:left', 'alignment:center', 'alignment:right', 'alignment:justify',
        '|',
        'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent',
        '|',
        'link', 'blockQuote', 'codeBlock', 'insertTable', 'imageUpload', 'mediaEmbed', 'horizontalLine',
        '|',
        'undo', 'redo'
      ],
      shouldNotGroupWhenFull: true
    },
    fontFamily: {
      supportAllValues: true,
      options: [
        'default',
        'Arial, Helvetica, sans-serif',
        'Georgia, serif',
        'Tahoma, Geneva, sans-serif',
        'Times New Roman, Times, serif',
        'Trebuchet MS, Helvetica, sans-serif',
        'Verdana, Geneva, sans-serif',
        'PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, Helvetica, sans-serif'
      ]
    },
    fontSize: { options: [8,10,12,14,16,18,20,24,28,32,36], supportAllValues: true },
    heading: {
      options: [
        { model: 'paragraph', title: '段落', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: '标题 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: '标题 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: '标题 3', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: '标题 4', class: 'ck-heading_heading4' }
      ]
    },
    image: {
      toolbar: [
        'imageTextAlternative', 'toggleImageCaption', 'imageStyle:inline', 'imageStyle:block', 'imageStyle:side', 'linkImage'
      ]
    },
    table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] },
    list: { properties: { styles: true, startIndex: true, reversed: true } },
    language: 'zh-cn',
    removePlugins: [
      'CKBox','CKBoxUtils','CKBoxImageEditEditing','CKBoxImageEditUI','CKBoxImageEdit',
      'CKFinder','EasyImage','ExportPdf','ExportWord','AIAssistant','SlashCommand',
      'RealTimeCollaborativeComments','RealTimeCollaborativeTrackChanges','RealTimeCollaborativeRevisionHistory',
      'PresenceList','Comments','CommentsEditing','CommentsUI','CommentsRepository',
      'TrackChanges','TrackChanges2','TrackChangesEditing','TrackChangesUI','TrackChangesData',
      'RevisionHistory','WProofreader','MathType','CloudServices','TableOfContents','HtmlEmbed','DocumentOutline',
      'Pagination','MultiLevelList','MultiLevelListUI','Users','FormatPainter','Template','PasteFromOfficeEnhanced',
      'CaseChange','ImportWord','Suggestions'
    ]
  })
  try { editor.setData(props.modelValue || '') } catch {}
  editor.model.document.on('change:data', () => {
    try { emit('update:modelValue', editor.getData() || '') } catch {}
  })
}

onMounted(create)

onBeforeUnmount(async () => {
  try { if (editor) await editor.destroy() } catch {}
  editor = null
})

watch(() => props.modelValue, (v) => {
  try {
    if (!editor) return
    const cur = editor.getData() || ''
    if (String(v || '') !== String(cur)) editor.setData(v || '')
  } catch {}
})
</script>

<style scoped>
.ck-editor-host { min-height: 420px; }
:deep(.ck.ck-editor__editable),
:deep(.ck.ck-editor__editable_inline),
:deep(.ck-content) { min-height: 420px; padding-bottom: 16px; }
</style>