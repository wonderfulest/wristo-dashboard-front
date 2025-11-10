<template>
  <el-popover placement="bottom-start" trigger="click" width="520" :persistent="true">
    <template #reference>
      <span class="i18n-summary">{{ summary }}</span>
    </template>
    <div class="i18n-editor">
      <table class="i18n-table">
        <thead>
          <tr>
            <th style="width: 30px;">Lang</th>
            <th style="width: 120px;">Long</th>
            <th style="width: 120px;">Medium</th>
            <th style="width: 120px;">Short</th>
            <th style="width: 56px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lang in orderedKeys" :key="lang">
            <td class="lang">{{ lang }}</td>
            <td class="text">
              <el-input :model-value="editI18n[lang]?.long ?? ''" @update:model-value="onEditField(lang, 'long', $event)" placeholder="long" size="small" />
            </td>
            <td class="text">
              <el-input :model-value="editI18n[lang]?.medium ?? ''" @update:model-value="onEditField(lang, 'medium', $event)" placeholder="medium" size="small" />
            </td>
            <td class="text">
              <el-input :model-value="editI18n[lang]?.short ?? ''" @update:model-value="onEditField(lang, 'short', $event)" placeholder="short" size="small" />
            </td>
            <td class="ops">
              <el-button link type="danger" size="small" @click="removeLang(lang)">Del</el-button>
            </td>
          </tr>
          <tr>
            <td colspan="5">
              <div class="add-lang">
                <el-select v-model="newLang" placeholder="select language" size="small" style="width: 220px;" :teleported="false">
                  <el-option
                    v-for="code in supportedLangs"
                    :key="code"
                    :label="code"
                    :value="code"
                    :disabled="Boolean(editI18n[code] || (row.labelI18n && row.labelI18n[code]))"
                  />
                </el-select>
                <el-button size="small" @click="addLang">Add</el-button>
                <span class="hint">Preferred order: eng, zhs, others</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="i18n-actions">
        <el-button size="small" type="primary" @click="save">Save</el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { DataTypeOptionVO, LabelI18nItem } from '@/types/data-type-option'
import { updateDataTypeOption } from '@/api/data-type-options'

const props = defineProps<{
  row: DataTypeOptionVO
  supportedLangs: string[]
}>()

const emit = defineEmits<{ (e: 'updated'): void }>()

const editI18n = reactive<Record<string, LabelI18nItem>>({})
const newLang = ref('')

function initEdit() {
  const src = props.row.labelI18n || {}
  Object.keys(src).forEach(k => { editI18n[k] = { ...(src[k] || {}) } })
}
initEdit()

function orderedKeys(): string[] {
  const keys = Object.keys(props.row.labelI18n || {})
  const ordered: string[] = []
  if (keys.includes('eng')) ordered.push('eng')
  if (keys.includes('zhs')) ordered.push('zhs')
  const others = keys.filter(k => k !== 'eng' && k !== 'zhs').sort()
  return ordered.concat(others)
}

const summary = computed(() => orderedKeys().join(', '))

function onEditField(lang: string, field: keyof LabelI18nItem, v: string) {
  if (!editI18n[lang]) editI18n[lang] = {}
  ;(editI18n[lang] as any)[field] = v
}

function addLang() {
  const code = newLang.value
  if (!code) return
  if (!editI18n[code]) editI18n[code] = {}
  newLang.value = ''
}

function removeLang(lang: string) {
  if (editI18n[lang]) delete editI18n[lang]
}

async function save() {
  const payload = { labelI18n: editI18n }
  await updateDataTypeOption(Number(props.row.id), payload)
  emit('updated')
}
</script>

<style scoped>
.i18n-summary { cursor: pointer; color: #409EFF; }
.i18n-editor { }
.i18n-table { width: 100%; border-collapse: collapse; }
.i18n-actions { margin-top: 8px; }
.add-lang { display: flex; gap: 8px; align-items: center; }
.lang { width: 30px; }
.text { width: 120px; }
.ops { width: 56px; }
</style>
