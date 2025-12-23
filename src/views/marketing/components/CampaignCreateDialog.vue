<template>
  <el-dialog v-model="visibleInner" title="新建活动" width="640px" @closed="$emit('closed')">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="活动名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入活动名称" />
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="活动描述（可选）" />
      </el-form-item>
      <el-form-item label="创建人">
        <el-input v-model="form.creator" placeholder="创建人（可选）" />
      </el-form-item>
      <el-form-item label="分群">
        <el-select v-model="form.segmentId" filterable clearable placeholder="选择分群" style="width: 100%" :loading="loadingSegments">
          <el-option v-for="s in segmentOptions" :key="s.id" :label="`${s.name} (#${s.id})`" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="邮件模板">
        <el-select v-model="form.emailTemplateId" filterable clearable placeholder="选择邮件模板" style="width: 100%" :loading="loadingEmailTpls">
          <el-option v-for="t in emailTplOptions" :key="t.id" :label="`${t.name} (#${t.id})`" :value="t.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
          <el-option v-for="it in campaignStatusOptions" :key="it.value" :label="it.label" :value="it.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="模板参数">
        <JsonEditor v-model="form.variables" label="模板参数 (JSON)" placeholder='请输入 JSON 格式参数，如: {"userName": "张三"}' :rows="4" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visibleInner = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { CampaignCreateDTO, MarketingCampaignStatus } from '@/types/promotion'
import { listSegments, type SegmentVO } from '@/api/segment'
import { fetchEmailTemplatePage } from '@/api/email-template'
import type { ApiResponse, PageResponse } from '@/types/api'
import JsonEditor from '@/components/common/JsonEditor.vue'
import { listEnumOptions } from '@/api/common'
import type { EnumOption } from '@/api/common'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'submit', v: CampaignCreateDTO): void; (e: 'closed'): void }>()

const visibleInner = ref(false)
watch(() => props.visible, v => (visibleInner.value = v), { immediate: true })
watch(visibleInner, v => emit('update:visible', v))

const formRef = ref<FormInstance>()
const form = reactive<CampaignCreateDTO>({ name: '', startTime: undefined, endTime: undefined, description: '', creator: '', status: 'DRAFT', segmentId: undefined, emailTemplateId: undefined, variables: undefined })
const rules: FormRules = { name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }, { min: 2, message: '至少2个字符', trigger: 'blur' }] }

const campaignStatusOptions = ref<Array<{ label: string; value: MarketingCampaignStatus }>>([])
const loadCampaignStatusOptions = async () => {
  try {
    const res = await listEnumOptions('com.wukong.face.modules.campaign.enums.MarketingCampaignStatus')
    const list: any[] = (res as any)?.data?.data || (res as any)?.data || []
    const opts: Array<{ label: string; value: MarketingCampaignStatus }> = []
    for (const it of list || []) {
      const name = String((it as any)?.name ?? '')
      const label = String((it as any)?.props?.displayName ?? (it as EnumOption)?.description ?? name)

      if (name) {
        opts.push({ label: label || name, value: name as MarketingCampaignStatus })
        continue
      }

      const code = Number((it as any)?.props?.code ?? (it as EnumOption)?.value)
      if (Number.isNaN(code)) continue
      const fallback =
        code === 0 ? 'DRAFT' : code === 1 ? 'RUNNING' : code === 2 ? 'COMPLETED' : code === 3 ? 'SCHEDULED' : code === 4 ? 'CANCELLED' : undefined
      if (!fallback) continue
      opts.push({ label: label || fallback, value: fallback })
    }
    campaignStatusOptions.value = opts
  } catch {
    campaignStatusOptions.value = []
  }
}

const dateRange = ref<[string, string] | undefined>()
watch(dateRange, (val) => {
  if (val && val.length === 2) {
    form.startTime = val[0]
    form.endTime = val[1]
  } else {
    form.startTime = undefined
    form.endTime = undefined
  }
})

// Segment options
const segmentOptions = ref<SegmentVO[]>([])
const loadingSegments = ref(false)
const loadSegments = async () => {
  loadingSegments.value = true
  try {
    const res = await listSegments()
    segmentOptions.value = res.data || []
  } finally { loadingSegments.value = false }
}

// Email template options (first page 100)
const emailTplOptions = ref<Array<{ id: number; name: string }>>([])
const loadingEmailTpls = ref(false)
const loadEmailTemplates = async () => {
  loadingEmailTpls.value = true
  try {
    const res: ApiResponse<PageResponse<any>> = await fetchEmailTemplatePage({ pageNum: 1, pageSize: 100 }) as any
    emailTplOptions.value = (res.data?.list || []).map((it: any) => ({ id: it.id, name: it.name }))
  } finally { loadingEmailTpls.value = false }
}

const saving = ref(false)
const submit = async () => {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  saving.value = true
  try {
    emit('submit', { ...form })
    visibleInner.value = false
  } finally { saving.value = false }
}

loadSegments()
loadEmailTemplates()
loadCampaignStatusOptions()
</script>
