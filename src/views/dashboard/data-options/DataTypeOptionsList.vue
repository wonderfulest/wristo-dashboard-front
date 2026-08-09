<template>
  <div>
    <el-table :data="list" style="width: 100%" v-loading="loading" border @sort-change="onSort">
      <el-table-column prop="valueCode" label="Code" width="70" sortable="custom" />
      <el-table-column prop="metricSymbol" label="Metric Symbol" min-width="280" />
      <el-table-column prop="category" label="Category" width="110" />
      <el-table-column label="Connect IQ Settings Label" min-width="200">
        <template #default="{ row }">
          <div>{{ row.settingsLabel.eng }}</div>
          <div class="secondary">{{ row.settingsLabel.zhs }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Watchface Data Label" min-width="180">
        <template #default="{ row }">
          <div>{{ row.label.eng }}</div>
          <div class="secondary">{{ row.label.zhs }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Resources" min-width="230">
        <template #default="{ row }">
          <code>DataTypeSettingsLabel{{ row.valueCode }}</code>
          <code>DataTypeLabel{{ row.valueCode }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="unitKey" label="Unit Key" width="120" />
      <el-table-column prop="iconUnicode" label="Icon Unicode" min-width="110" />
      <el-table-column prop="iconRules" label="Icon Rules" min-width="130">
        <template #default="{ row }">{{ iconRulesSummary(row) }}</template>
      </el-table-column>
      <el-table-column prop="defaultValue" label="Default" min-width="110" />
      <el-table-column label="Dial" min-width="160">
        <template #default="{ row }">{{ dialSummary(row) }}</template>
      </el-table-column>
      <el-table-column prop="isActive" label="Active" width="100" sortable="custom">
        <template #default="{ row }">
          <el-switch
            :model-value="row.isActive"
            :active-value="1"
            :inactive-value="0"
            :loading="activeLoadingIds.has(Number(row.id))"
            active-text="Yes"
            inactive-text="No"
            inline-prompt
            aria-label="Toggle data type option active state"
            @change="handleActiveSwitchChange(row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="Sort" width="90" sortable="custom" />
      <el-table-column label="Action" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link :disabled="editDisabled" @click="$emit('edit', row)">Edit</el-button>
          <el-button type="danger" link @click="$emit('delete', row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="pageNumLocal"
        v-model:page-size="pageSizeLocal"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { DataTypeOptionVO, IconRules } from '@/types/data-type-option'
import { dialSummary } from './dialConfig.mjs'

const props = defineProps({
  list: { type: Array as PropType<DataTypeOptionVO[]>, default: () => [] },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  pageNum: { type: Number, default: 1 },
  pageSize: { type: Number, default: 100 },
  activeLoadingIds: { type: Object as PropType<Set<number>>, default: () => new Set<number>() },
  editDisabled: { type: Boolean, default: false },
})

const emit = defineEmits<{
  (e: 'sort-change', payload: { prop: string; order: 'ascending' | 'descending' | null }): void
  (e: 'size-change', size: number): void
  (e: 'current-change', page: number): void
  (e: 'edit', row: DataTypeOptionVO): void
  (e: 'delete', row: DataTypeOptionVO): void
  (e: 'active-change', row: DataTypeOptionVO, value: number): void
}>()

const pageNumLocal = ref(props.pageNum)
const pageSizeLocal = ref(props.pageSize)
watch(() => props.pageNum, value => pageNumLocal.value = value)
watch(() => props.pageSize, value => pageSizeLocal.value = value)

function onSort(payload: any) {
  emit('sort-change', { prop: payload?.prop, order: payload?.order })
}

function onSizeChange(size: number) { emit('size-change', size) }
function onCurrentChange(page: number) { emit('current-change', page) }
function handleActiveSwitchChange(row: DataTypeOptionVO, value: string | number | boolean) {
  emit('active-change', row, Number(value))
}

function iconRulesSummary(row: DataTypeOptionVO): string {
  const rules: IconRules | undefined = row.iconRules
  if (!rules?.type) return ''
  if (rules.type === 'numeric') return `numeric: ${(rules.ranges || []).length} ranges`
  return `${rules.type}: ${rules.icons ? Object.keys(rules.icons).length : 0} icons`
}
</script>

<style scoped>
.pagination { margin-top: 16px; text-align: right; }
.secondary { color: #909399; margin-top: 2px; }
code { display: block; white-space: nowrap; }
</style>
