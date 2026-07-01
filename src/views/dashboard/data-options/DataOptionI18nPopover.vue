<template>
  <el-popover placement="bottom-start" trigger="click" width="420" :persistent="true">
    <template #reference>
      <button class="i18n-summary" type="button" aria-label="Edit i18n labels">
        <template v-if="summaryItems.length">
          <span v-for="item in summaryItems" :key="item.lang" class="summary-chip">
            <span class="summary-lang">{{ item.lang }}</span>
            <span class="summary-text">{{ item.value }}</span>
          </span>
        </template>
        <span v-else class="summary-empty">No i18n values</span>
      </button>
    </template>

    <div class="i18n-editor">
      <div v-if="orderedKeys.length" class="i18n-rows">
        <div v-for="lang in orderedKeys" :key="lang" class="i18n-row">
          <span class="lang">{{ lang }}</span>
          <el-input
            :model-value="editI18n[lang] ?? ''"
            placeholder="Display value"
            size="small"
            clearable
            aria-label="i18n display value"
            @update:model-value="onEditField(lang, $event)"
          />
          <el-button link type="danger" size="small" @click="removeLang(lang)">Del</el-button>
        </div>
      </div>
      <div v-else class="empty-i18n">No i18n values</div>

      <div class="i18n-actions">
        <el-select v-model="newLang" placeholder="Language" size="small" class="lang-select" :teleported="false">
          <el-option
            v-for="code in supportedLangs"
            :key="code"
            :label="code"
            :value="code"
            :disabled="hasLang(code)"
          />
        </el-select>
        <el-button size="small" @click="addLang">Add</el-button>
        <el-button size="small" type="primary" :loading="saving" @click="save">Save</el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { DataTypeOptionVO } from '@/types/data-type-option'
import { updateDataTypeOption } from '@/api/data-type-options'

const props = defineProps<{
  row: DataTypeOptionVO
  supportedLangs: string[]
}>()

const emit = defineEmits<{ (e: 'updated'): void }>()

const editI18n = reactive<Record<string, string>>({})
const newLang = ref('')
const saving = ref(false)

function initEdit() {
  Object.keys(editI18n).forEach(k => delete editI18n[k])
  const src = props.row.labelI18n || {}
  Object.keys(src).forEach(k => { editI18n[k] = normalizeValue((src as any)[k]) })
}
initEdit()
watch(() => props.row.labelI18n, initEdit, { deep: true })

const orderedKeys = computed((): string[] => {
  const keys = Object.keys(editI18n || {})
  const ordered: string[] = []
  if (keys.includes('eng')) ordered.push('eng')
  if (keys.includes('zhs')) ordered.push('zhs')
  const others = keys.filter(k => k !== 'eng' && k !== 'zhs').sort()
  return ordered.concat(others)
})

const summaryItems = computed(() => orderedKeys.value.map(lang => ({
  lang,
  value: editI18n[lang] || '-'
})))

function normalizeValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return String((value as any).short || '')
  return ''
}

function hasLang(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(editI18n, code)
    || Object.prototype.hasOwnProperty.call(props.row.labelI18n || {}, code)
}

function onEditField(lang: string, v: string | number) {
  editI18n[lang] = String(v)
}

function addLang() {
  const code = newLang.value
  if (!code) return
  if (!editI18n[code]) editI18n[code] = ''
  newLang.value = ''
}

function removeLang(lang: string) {
  if (editI18n[lang]) delete editI18n[lang]
}

async function save() {
  saving.value = true
  try {
    const payload = { labelI18n: { ...editI18n } }
    await updateDataTypeOption(Number(props.row.id), payload)
    ElMessage.success('i18n updated')
    emit('updated')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.i18n-summary {
  display: flex;
  width: 100%;
  min-height: 32px;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
}
.summary-chip {
  display: inline-flex;
  max-width: 100%;
  align-items: flex-start;
  gap: 4px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 4px 7px;
  background: #f8fafc;
  font-size: 12px;
  line-height: 18px;
}
.summary-lang {
  flex: 0 0 auto;
  color: #909399;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}
.summary-text {
  color: #303133;
  font-weight: 600;
  white-space: normal;
  word-break: break-word;
}
.summary-empty { color: #909399; font-size: 12px; }
.i18n-editor { display: flex; flex-direction: column; gap: 8px; min-width: 240px; }
.i18n-rows { display: flex; flex-direction: column; gap: 6px; }
.i18n-row { display: grid; grid-template-columns: 42px minmax(120px, 1fr) 42px; align-items: center; gap: 8px; }
.lang { color: #909399; font-size: 11px; font-weight: 500; line-height: 24px; text-transform: uppercase; }
.empty-i18n { color: #909399; font-size: 12px; line-height: 24px; }
.i18n-actions { display: flex; align-items: center; gap: 8px; }
.lang-select { width: 112px; }
</style>
