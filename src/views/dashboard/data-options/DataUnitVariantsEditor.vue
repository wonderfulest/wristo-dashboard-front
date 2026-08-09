<template>
  <div class="variants-editor">
    <div class="variants-header">
      <span>Variants</span>
      <el-button size="small" :disabled="disabled || noneUnit" @click="addVariant(form)">Add variant</el-button>
    </div>
    <el-empty v-if="noneUnit" description="The none unit has no variants" :image-size="48" />
    <el-card v-for="(variant, key) in form.variants" v-else :key="key" shadow="never" class="variant-card">
      <div class="variant-grid">
        <el-form-item label="Variant key" required>
          <el-input v-model="variantKeyDrafts[key]" :disabled="disabled" @change="onRenameInput(String(key), $event)" />
        </el-form-item>
        <el-form-item label="Default">
          <el-radio v-model="form.defaultVariant" :label="String(key)" :disabled="disabled">Default</el-radio>
        </el-form-item>
        <el-form-item label="English" required>
          <el-input v-model="variant.label.eng" :disabled="disabled" />
        </el-form-item>
        <el-form-item label="简体中文" required>
          <el-input v-model="variant.label.zhs" :disabled="disabled" />
        </el-form-item>
        <el-form-item label="Aliases" class="aliases" required>
          <el-select
            v-model="variant.aliases"
            multiple
            filterable
            allow-create
            default-first-option
            :disabled="disabled"
            @change="normalizeAliasInput(variant, $event)"
          />
        </el-form-item>
        <el-button type="danger" link :disabled="disabled" @click="onDelete(String(key))">Delete</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { PropType } from 'vue'
import type { DataUnitVariant } from '@/types/data-unit-definition'
import type { UnitForm } from './unitCatalogEditor.mjs'
import { addVariant, commitVariantKeyDraft, deleteVariant } from './unitCatalogEditor.mjs'

const props = defineProps({
  form: { type: Object as PropType<UnitForm>, required: true },
  disabled: { type: Boolean, default: false },
})
const noneUnit = computed(() => props.form.unitKey === 'none')
const variantKeyDrafts = reactive<Record<string, string>>({})

watch(() => Object.keys(props.form.variants).join('\u0000'), () => {
  for (const key of Object.keys(variantKeyDrafts)) delete variantKeyDrafts[key]
  for (const key of Object.keys(props.form.variants)) variantKeyDrafts[key] = key
}, { immediate: true })

function onRename(oldKey: string, value: string) {
  const error = commitVariantKeyDraft(props.form, variantKeyDrafts, oldKey, value)
  if (error) ElMessage.error(error)
}

function onRenameInput(oldKey: string, value: unknown) {
  onRename(oldKey, String(value ?? ''))
}

function onDelete(key: string) {
  const error = deleteVariant(props.form, key)
  if (error) ElMessage.warning(error)
}

function normalizeAliases(variant: DataUnitVariant, values: string[]) {
  variant.aliases = [...new Set(values.map(value => value.trim().toLowerCase()).filter(Boolean))].sort()
}

function normalizeAliasInput(variant: DataUnitVariant, values: unknown) {
  normalizeAliases(variant, Array.isArray(values) ? values.map(String) : [])
}
</script>

<style scoped>
.variants-editor { width: 100%; }
.variants-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-weight: 600; }
.variant-card + .variant-card { margin-top: 12px; }
.variant-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 0 16px; align-items: start; }
.variant-grid .aliases { grid-column: 1 / -1; }
</style>
