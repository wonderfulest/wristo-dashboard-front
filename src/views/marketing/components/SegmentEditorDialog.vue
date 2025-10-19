<template>
  <el-dialog v-model="innerVisible" :title="isEdit ? '编辑分群' : '新增分群'" width="860" @closed="onClosed">
    <el-form :model="form" label-width="100px">
      <el-form-item label="名称" required>
        <el-input v-model="form.name" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="规则逻辑">
        <el-radio-group v-model="ruleBuilder.logic">
          <el-radio-button label="and">AND</el-radio-button>
          <el-radio-button label="or">OR</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="条件列表">
        <div class="conditions-wrap">
          <div class="condition-row" v-for="(c, idx) in ruleBuilder.conditions" :key="idx">
            <el-select v-model="c.field" placeholder="字段" style="width: 280px">
              <el-option v-for="f in fieldOptions" :key="f.value" :label="f.label" :value="f.value" />
            </el-select>
            <el-select v-model="c.op" placeholder="操作符" style="width: 140px">
              <el-option v-for="op in opOptions" :key="op.value" :label="op.label" :value="op.value" />
            </el-select>
            <template v-if="c.op === 'between'">
              <el-input v-model="c.value" placeholder="最小值" style="width: 160px" />
              <span style="margin: 0 6px;">~</span>
              <el-input v-model="c.value2" placeholder="最大值" style="width: 160px" />
            </template>
            <template v-else>
              <el-input v-model="c.value" placeholder="值" style="width: 340px" />
            </template>
            <el-button type="danger" plain @click="removeCondition(idx)">删除</el-button>
          </div>
          <div>
            <el-button type="primary" plain @click="addCondition">新增条件</el-button>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="规则JSON">
        <el-input :model-value="generatedRuleJson" type="textarea" :rows="6" readonly />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" maxlength="200" show-word-limit />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" style="width: 180px;">
          <el-option :value="1" label="启用" />
          <el-option :value="0" label="禁用" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="innerVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleConfirm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { SegmentCreateDTO, SegmentUpdateDTO, SegmentVO } from '@/api/segment'
import { getUserProfileColumns, type TableColumn } from '@/api/metadata'

const props = defineProps<{ visible: boolean; isEdit: boolean; initial: Partial<SegmentVO> | null }>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'submit', payload: { isEdit: boolean; id?: number; create?: SegmentCreateDTO; update?: SegmentUpdateDTO }): void }>()

const innerVisible = ref(false)
watch(() => props.visible, v => (innerVisible.value = v), { immediate: true })
watch(innerVisible, v => emit('update:visible', v))

const saving = ref(false)

type SegmentForm = {
  name: string
  code?: string
  category?: string
  type?: string
  ruleExpr?: string
  description?: string
  status?: number
}

const form = ref<SegmentForm>({
  name: '',
  code: '',
  category: '',
  type: '',
  ruleExpr: '',
  description: '',
  status: 1,
})

// Field options from metadata
const fieldOptions = ref<Array<{ label: string; value: string }>>([])
const loadUserProfileFields = async () => {
  try {
    const res = await getUserProfileColumns()
    const cols = (res.data || []) as TableColumn[]
    fieldOptions.value = cols.map(c => ({ label: `${c.comment || c.field} ${c.field}`.trim(), value: c.field }))
  } catch {}
}

// Rule builder
type Logic = 'and' | 'or'
 type Condition = { field: string; op: '==' | '>' | '<' | 'between' | 'like'; value?: string; value2?: string }
const ruleBuilder = ref<{ logic: Logic; conditions: Condition[] }>({ logic: 'and', conditions: [{ field: '', op: '==', value: '' }] })
const addCondition = () => ruleBuilder.value.conditions.push({ field: '', op: '==', value: '' })
const removeCondition = (idx: number) => ruleBuilder.value.conditions.splice(idx, 1)
const opOptions = [
  { label: '=', value: '==' },
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: 'between', value: 'between' },
  { label: 'like', value: 'like' },
]
const generatedRuleJson = computed(() => {
  const payload: any = { logic: ruleBuilder.value.logic, conditions: [] as any[] }
  for (const c of ruleBuilder.value.conditions) {
    if (!c.field || !c.op) continue
    if (c.op === 'between') {
      payload.conditions.push({ field: c.field, op: 'between', value: [c.value, c.value2] })
    } else {
      payload.conditions.push({ field: c.field, op: c.op === '==' ? '=' : c.op, value: c.value })
    }
  }
  return JSON.stringify(payload)
})

const initFromInitial = () => {
  // base fields
  form.value = {
    name: props.initial?.name || '',
    code: (props.initial as any)?.code || '',
    category: (props.initial as any)?.category || '',
    type: (props.initial as any)?.type || '',
    ruleExpr: props.initial?.ruleExpr || '',
    description: props.initial?.description || '',
    status: props.initial?.status ?? 1,
  }
  // rule builder
  initRuleBuilder(props.initial?.ruleExpr)
}

const initRuleBuilder = (expr?: string) => {
  try {
    const obj = expr ? JSON.parse(expr) : null
    if (obj && Array.isArray(obj.conditions) && (obj.logic === 'and' || obj.logic === 'or')) {
      const conds: Condition[] = obj.conditions.map((it: any) => {
        if (it.op === 'between' && Array.isArray(it.value)) {
          return { field: it.field || '', op: 'between', value: it.value?.[0] ?? '', value2: it.value?.[1] ?? '' }
        }
        const op = it.op === '=' ? '==' : it.op
        return { field: it.field || '', op, value: it.value ?? '' }
      })
      ruleBuilder.value = { logic: obj.logic, conditions: conds.length ? conds : [{ field: '', op: '==', value: '' }] }
      return
    }
  } catch {}
  ruleBuilder.value = { logic: 'and', conditions: [{ field: '', op: '==', value: '' }] }
}

watch(() => props.initial, () => initFromInitial(), { immediate: true })

const handleConfirm = async () => {
  if (!form.value.name?.trim()) return
  form.value.ruleExpr = generatedRuleJson.value
  saving.value = true
  try {
    if (props.isEdit && props.initial?.id) {
      const { name, ruleExpr, description, status } = form.value
      const payload: SegmentUpdateDTO = { name, ruleExpr, description, status }
      emit('submit', { isEdit: true, id: props.initial.id, update: payload })
    } else {
      const { name, ruleExpr, description, status } = form.value
      const payload: SegmentCreateDTO = { name, ruleExpr, description, status }
      emit('submit', { isEdit: false, create: payload })
    }
  } finally {
    saving.value = false
  }
}

const onClosed = () => {
  // reset simple state if needed
}

loadUserProfileFields()
</script>

<style scoped>
.conditions-wrap { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.condition-row { display: flex; align-items: center; gap: 8px; }
</style>
