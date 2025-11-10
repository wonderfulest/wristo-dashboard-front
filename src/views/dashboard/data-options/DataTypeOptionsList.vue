<template>
  <div>
    <el-table :data="list" style="width: 100%" v-loading="loading" border @sort-change="onSort">
      <el-table-column prop="valueCode" label="Code" width="60" sortable="custom" />
      <el-table-column prop="metricSymbol" label="Metric Symbol" min-width="320" />
      <el-table-column prop="category" label="Category" width="120" />

      <el-table-column prop="label" label="Label" min-width="140" :formatter="labelEnFormatter" />
      <el-table-column prop="labelI18n" label="i18n" min-width="60">
        <template #default="{ row }">
          <DataOptionI18nPopover :row="row" :supported-langs="supportedLangs" @updated="$emit('refresh')" />
        </template>
      </el-table-column>
      <el-table-column prop="iconUnicode" label="Icon Unicode" min-width="100" />
      <el-table-column prop="iconRules" label="Icon Rules" min-width="120">
        <template #default="{ row }">
          <span>{{ iconRulesSummary(row) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="Unit" width="100" />
      <el-table-column prop="defaultValue" label="Default" min-width="120" />
      <el-table-column prop="isActive" label="Active" width="100" sortable="custom">
        <template #default="{ row }">
          <el-tag :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? 'Yes' : 'No' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="Sort" width="90" sortable="custom" />
      <el-table-column label="Action" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="$emit('edit', row)">Edit</el-button>
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
import DataOptionI18nPopover from './DataOptionI18nPopover.vue'

const props = defineProps({
  list: { type: Array as PropType<DataTypeOptionVO[]>, default: () => [] },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  pageNum: { type: Number, default: 1 },
  pageSize: { type: Number, default: 100 },
  supportedLangs: { type: Array as PropType<string[]>, default: () => [] },
})

const emit = defineEmits<{
  (e: 'sort-change', payload: { prop: string; order: 'ascending' | 'descending' | null }): void
  (e: 'size-change', size: number): void
  (e: 'current-change', page: number): void
  (e: 'edit', row: DataTypeOptionVO): void
  (e: 'delete', row: DataTypeOptionVO): void
  (e: 'refresh'): void
}>()

const pageNumLocal = ref(props.pageNum)
const pageSizeLocal = ref(props.pageSize)

watch(() => props.pageNum, v => pageNumLocal.value = v)
watch(() => props.pageSize, v => pageSizeLocal.value = v)

function onSort(payload: any) {
  emit('sort-change', { prop: payload?.prop, order: payload?.order })
}

function onSizeChange(size: number) {
  emit('size-change', size)
}

function onCurrentChange(page: number) {
  emit('current-change', page)
}

function labelEnFormatter(row: any) {
  const i18n = row?.labelI18n
  const eng = i18n?.eng
  return eng?.long || row.label || ''
}

function iconRulesSummary(row: any): string {
  console.log(row)
  const rules: IconRules | undefined = row?.iconRules
  if (!rules || !rules.type) return ''
  if (rules.type === 'numeric') {
    const n = (rules.ranges || []).length
    return `numeric: ${n} ranges`
  }
  const n = rules.icons ? Object.keys(rules.icons).length : 0
  return `${rules.type}: ${n} icons`
}
</script>

<style scoped>
.pagination { margin-top: 16px; text-align: right; }
</style>
