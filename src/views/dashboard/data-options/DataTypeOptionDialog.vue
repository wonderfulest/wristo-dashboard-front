<template>
  <el-dialog v-model="visibleLocal" :title="titleText" width="760px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="130px">
      <div class="form-grid">
        <el-form-item label="Symbol" prop="metricSymbol" class="full">
          <el-input v-model="form.metricSymbol" />
        </el-form-item>
        <el-form-item label="Category" prop="category">
          <el-select v-model="form.category" placeholder="Category">
            <el-option v-for="category in categories" :key="category" :label="category" :value="category" />
          </el-select>
        </el-form-item>
        <el-form-item label="Value Code" prop="valueCode">
          <el-input-number v-model="form.valueCode" :min="0" />
        </el-form-item>

        <section class="label-section full">
          <h3>Connect IQ Settings Label</h3>
          <p>Shown to users in the Garmin Connect IQ app settings page.</p>
          <div class="label-fields">
            <el-form-item label="English" prop="settingsLabel.eng">
              <el-input v-model="form.settingsLabel.eng" />
            </el-form-item>
            <el-form-item label="简体中文" prop="settingsLabel.zhs">
              <el-input v-model="form.settingsLabel.zhs" />
            </el-form-item>
          </div>
        </section>

        <section class="label-section full">
          <h3>Watchface Data Label</h3>
          <p>Rendered as the data-item label on the watchface.</p>
          <div class="label-fields">
            <el-form-item label="English" prop="label.eng">
              <el-input v-model="form.label.eng" />
            </el-form-item>
            <el-form-item label="简体中文" prop="label.zhs">
              <el-input v-model="form.label.zhs" />
            </el-form-item>
          </div>
        </section>

        <el-form-item label="Unit" prop="unitKey" class="full">
          <div class="unit-field">
            <el-select v-model="form.unitKey" filterable>
              <el-option
                v-for="unit in units"
                :key="unit.unitKey"
                :value="unit.unitKey"
                :label="`${unit.name} (${unit.unitKey})${unit.isActive === 0 ? ' — inactive' : ''}`"
              />
            </el-select>
            <div v-if="selectedUnit" class="unit-preview">
              <div>Default: {{ selectedUnit.defaultVariant || 'none' }}</div>
              <div v-for="(variant, key) in selectedUnit.variants" :key="key">
                {{ key }}: {{ variant.label.eng }} / {{ variant.label.zhs }}
                <span class="aliases">({{ variant.aliases.join(', ') }})</span>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="Icon Unicode" prop="iconUnicode">
          <el-input v-model="form.iconUnicode" />
        </el-form-item>
        <el-form-item label="Default Value" prop="defaultValue">
          <el-input v-model="form.defaultValue" />
        </el-form-item>
        <el-form-item label="Icon Rules" class="full">
          <DataOptionIconRulesEditor v-model:enabled="switchIconRules" v-model="form.iconRules" />
        </el-form-item>
        <el-form-item label="Dial Mode" prop="dialMode" class="full">
          <el-select v-model="form.dialMode" placeholder="Not Supported" clearable style="width: 220px">
            <el-option label="Not Supported" :value="null" />
            <el-option label="Goal" value="goal" />
            <el-option label="Range" value="range" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.dialMode === 'goal'" label="Goal Source" prop="dialGoalSource" class="full">
          <el-select v-model="form.dialGoalSource" style="width: 220px">
            <el-option label="Garmin Goal" value="garmin" />
          </el-select>
        </el-form-item>
        <template v-if="form.dialMode === 'range'">
          <el-form-item label="Range Min" prop="dialMin">
            <el-input-number v-model="form.dialMin" controls-position="right" />
          </el-form-item>
          <el-form-item label="Range Max" prop="dialMax">
            <el-input-number v-model="form.dialMax" controls-position="right" />
          </el-form-item>
        </template>
        <el-form-item label="Active" prop="isActive">
          <el-switch v-model="switchActive" />
        </el-form-item>
        <el-form-item label="Sort Order" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="Description" prop="description" class="full">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="onCancel">Cancel</el-button>
      <el-button type="primary" @click="onSave">Save</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { PropType } from 'vue'
import type { DataTypeOptionCreateDTO, DataTypeOptionUpdateDTO } from '@/types/data-type-option'
import type { DataUnitDefinitionVO } from '@/types/data-unit-definition'
import { createDataTypeOption, updateDataTypeOption } from '@/api/data-type-options'
import DataOptionIconRulesEditor from './DataOptionIconRulesEditor.vue'
import { normalizeDataTypePayload, validateDataTypeForm } from './dataCatalogForm.mjs'
import { normalizeDialFields, validateDialFields } from './dialConfig.mjs'

const props = defineProps({
  visible: { type: Boolean, default: false },
  type: { type: String as PropType<'add' | 'edit'>, default: 'add' },
  form: { type: Object as PropType<DataTypeOptionCreateDTO & { id?: number }>, required: true },
  categories: { type: Array as PropType<string[]>, default: () => [] },
  units: { type: Array as PropType<DataUnitDefinitionVO[]>, default: () => [] },
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}>()
const visibleLocal = ref(props.visible)
const formRef = ref()
const switchActive = ref((props.form.isActive ?? 1) === 1)
const switchIconRules = ref(!!props.form.iconRules)
const titleText = computed(() => props.type === 'add' ? 'Add Data Type Option' : 'Edit Data Type Option')
const selectedUnit = computed(() => props.units.find(unit => unit.unitKey === props.form.unitKey))

watch(() => props.visible, value => visibleLocal.value = value)
watch(visibleLocal, value => emit('update:visible', value))
watch(switchActive, value => { props.form.isActive = value ? 1 : 0 })
watch(() => props.form.isActive, value => { switchActive.value = (value ?? 1) === 1 })
watch(() => props.form.iconRules, value => { switchIconRules.value = !!value })
watch(switchIconRules, enabled => {
  if (!enabled) props.form.iconRules = undefined
  else if (!props.form.iconRules) props.form.iconRules = { type: 'boolean', icons: {} }
})
watch(() => props.form.iconRules?.type, type => {
  if (!type || !props.form.iconRules) return
  if (type === 'numeric') props.form.iconRules.ranges ||= []
  else props.form.iconRules.icons ||= {}
})
watch(() => props.form.dialMode, mode => {
  if (mode === 'goal' && !props.form.dialGoalSource) props.form.dialGoalSource = 'garmin'
  Object.assign(props.form, normalizeDialFields(props.form))
})

const required = (message: string, trigger = 'blur') => [{ required: true, message, trigger }]
const rules = {
  metricSymbol: required('Metric symbol required'),
  category: required('Category required', 'change'),
  valueCode: required('Value code required', 'change'),
  'settingsLabel.eng': required('Connect IQ English label required'),
  'settingsLabel.zhs': required('Connect IQ 简体中文标签必填'),
  'label.eng': required('Watchface English label required'),
  'label.zhs': required('Watchface 简体中文标签必填'),
  unitKey: required('Unit required', 'change'),
}

function onCancel() { visibleLocal.value = false }

function onSave() {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    const catalogError = validateDataTypeForm(props.form)
    if (catalogError) {
      ElMessage.error(catalogError)
      return
    }
    const dialError = validateDialFields(props.form)
    if (dialError) {
      ElMessage.error(dialError)
      return
    }
    Object.assign(props.form, normalizeDialFields(props.form))
    const payload = normalizeDataTypePayload(props.form)
    if (props.type === 'add') {
      await createDataTypeOption(payload as DataTypeOptionCreateDTO)
      ElMessage.success('Added successfully')
    } else {
      await updateDataTypeOption(Number(props.form.id), payload as DataTypeOptionUpdateDTO)
      ElMessage.success('Updated successfully')
    }
    visibleLocal.value = false
    emit('saved')
  })
}
</script>

<style scoped>
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 24px; }
.form-grid .full { grid-column: 1 / -1; }
.label-section { padding: 14px 16px 2px; border: 1px solid #dcdfe6; border-radius: 6px; }
.label-section h3 { margin: 0; font-size: 15px; }
.label-section p { margin: 5px 0 14px; color: #909399; font-size: 13px; }
.label-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.unit-field, .unit-field :deep(.el-select) { width: 100%; }
.unit-preview { margin-top: 8px; padding: 8px 10px; background: #f5f7fa; color: #606266; font-size: 12px; line-height: 1.7; }
.aliases { color: #909399; }
</style>
