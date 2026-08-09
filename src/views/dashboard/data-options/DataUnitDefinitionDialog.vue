<template>
  <el-dialog
    v-model="visibleLocal"
    :title="type === 'add' ? 'Add Unit' : 'Edit Unit'"
    width="820px"
    :close-on-click-modal="!saving"
    :close-on-press-escape="!saving"
    :show-close="!saving"
    :before-close="beforeClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <div class="form-grid">
        <el-form-item label="Unit key" prop="unitKey">
          <el-input v-model="form.unitKey" :disabled="type === 'edit' || saving" />
        </el-form-item>
        <el-form-item label="Name" prop="name"><el-input v-model="form.name" :disabled="saving" /></el-form-item>
        <el-form-item label="Active"><el-switch v-model="active" :disabled="saving || (form.referenceCount ?? 0) > 0" /></el-form-item>
        <el-form-item label="Sort order" prop="sortOrder"><el-input-number v-model="form.sortOrder" :min="0" :disabled="saving" /></el-form-item>
        <el-form-item label="Unit policy">
          <el-select v-model="form.selectionPolicy.type" :disabled="saving || form.unitKey === 'none'" @change="onPolicyTypeChange">
            <el-option label="Fixed" value="fixed" />
            <el-option label="Device setting" value="deviceSetting" />
            <el-option label="Provider" value="provider" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.selectionPolicy.type === 'fixed'" label="Fixed variant">
          <el-select v-model="form.selectionPolicy.variant" :disabled="saving">
            <el-option v-for="key in variantKeys" :key="key" :label="key" :value="key" />
          </el-select>
        </el-form-item>
        <template v-if="form.selectionPolicy.type === 'deviceSetting'">
          <el-form-item label="Device setting">
            <el-select v-model="form.selectionPolicy.setting" :disabled="saving">
              <el-option label="Distance units" value="distanceUnits" />
              <el-option label="Temperature units" value="temperatureUnits" />
            </el-select>
          </el-form-item>
          <el-form-item label="Metric variant">
            <el-select v-model="form.selectionPolicy.mapping.metric" :disabled="saving">
              <el-option v-for="key in variantKeys" :key="key" :label="key" :value="key" />
            </el-select>
          </el-form-item>
          <el-form-item label="Statute variant">
            <el-select v-model="form.selectionPolicy.mapping.statute" :disabled="saving">
              <el-option v-for="key in variantKeys" :key="key" :label="key" :value="key" />
            </el-select>
          </el-form-item>
        </template>
        <el-form-item v-if="form.selectionPolicy.type === 'provider'" label="Preview fallback">
          <el-select v-model="form.selectionPolicy.fallbackVariant" clearable :disabled="saving">
            <el-option v-for="key in variantKeys" :key="key" :label="key" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="Description" class="full"><el-input v-model="form.description" type="textarea" :disabled="saving" /></el-form-item>
        <el-form-item class="full" label-width="0">
          <DataUnitVariantsEditor :form="form" :disabled="saving" />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <el-button :disabled="saving" @click="visibleLocal = false">Cancel</el-button>
      <el-button type="primary" :loading="saving" :disabled="saving" @click="onSave">Save</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { PropType } from 'vue'
import type { DataUnitDefinitionCreateDTO, DataUnitDefinitionUpdateDTO } from '@/types/data-unit-definition'
import DataUnitVariantsEditor from './DataUnitVariantsEditor.vue'
import type { UnitForm } from './unitCatalogEditor.mjs'
import { isInterceptorHandledError } from './unitCatalogEditor.mjs'
import { normalizeUnitPayload, validateUnitForm } from './dataCatalogForm.mjs'
import { createDataUnit, updateDataUnit } from '@/api/data-units'

const props = defineProps({
  visible: { type: Boolean, default: false },
  type: { type: String as PropType<'add' | 'edit'>, required: true },
  form: { type: Object as PropType<UnitForm & { referenceCount?: number }>, required: true },
  formVersion: { type: Number, required: true },
})
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void; (e: 'saved'): void }>()
const formRef = ref()
const saving = ref(false)
const saveSession = ref(0)
const visibleLocal = ref(props.visible)
const active = computed({
  get: () => props.form.isActive === 1,
  set: value => { props.form.isActive = value ? 1 : 0 },
})
const variantKeys = computed(() => Object.keys(props.form.variants ?? {}).sort())
const required = (message: string) => [{ required: true, message, trigger: 'blur' }]
const rules = { unitKey: required('Unit key required'), name: required('Name required') }

watch(() => props.visible, async value => {
  saveSession.value += 1
  saving.value = false
  visibleLocal.value = value
  if (value) {
    await nextTick()
    formRef.value?.clearValidate()
  }
})
watch(() => props.formVersion, async () => {
  saveSession.value += 1
  saving.value = false
  await nextTick()
  formRef.value?.clearValidate()
})
watch(visibleLocal, value => emit('update:visible', value))
watch(() => props.form.unitKey, value => {
  if (value === 'none') props.form.selectionPolicy = { type: 'none' }
  else if (props.form.selectionPolicy.type === 'none') onPolicyTypeChange('fixed')
})

function onPolicyTypeChange(value: string) {
  const first = variantKeys.value[0] ?? ''
  if (value === 'fixed') props.form.selectionPolicy = { type: 'fixed', variant: first }
  else if (value === 'deviceSetting') {
    props.form.selectionPolicy = {
      type: 'deviceSetting', setting: 'distanceUnits',
      mapping: { metric: first, statute: first },
    }
  } else if (value === 'provider') props.form.selectionPolicy = { type: 'provider' }
  else props.form.selectionPolicy = { type: 'none' }
}
async function onSave() {
  if (saving.value) return
  const session = saveSession.value
  saving.value = true
  try {
    const valid = await validateFormWithCallback(formRef.value)
    if (!valid) return
    const payload = normalizeUnitPayload(props.form)
    const error = validateUnitForm(payload)
    if (error) {
      ElMessage.error(error)
      return
    }
    try {
      if (props.type === 'add') await createDataUnit(payload as DataUnitDefinitionCreateDTO)
      else await updateDataUnit(Number(props.form.id), payload as DataUnitDefinitionUpdateDTO)
    } catch (error) {
      // The shared interceptor reports the exact backend/transport error.
      if (!isInterceptorHandledError(error)) {
        ElMessage.error(error instanceof Error ? error.message : 'Failed to save unit')
      }
      return
    }
    if (session !== saveSession.value) return
    ElMessage.success(props.type === 'add' ? 'Added successfully' : 'Updated successfully')
    visibleLocal.value = false
    emit('saved')
  } catch (error) {
    if (session !== saveSession.value) return
    ElMessage.error(error instanceof Error ? error.message : 'Failed to save unit')
  } finally {
    if (session === saveSession.value) saving.value = false
  }
}

function beforeClose(done: () => void) {
  if (!saving.value) done()
}

function validateFormWithCallback(form: any): Promise<boolean> {
  if (!form) throw new Error('Form is unavailable')
  return new Promise(resolve => form.validate((valid: boolean) => resolve(valid)))
}
</script>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; }
.full { grid-column: 1 / -1; }
</style>
