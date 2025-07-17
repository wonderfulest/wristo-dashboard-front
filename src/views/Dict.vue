<template>
  <div class="dict-container">
    <div class="header">
      <h2>Dictionary Management</h2>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input v-model="search.dictType" placeholder="Dict Type" clearable style="width: 160px" />
        <el-input v-model="search.dictCode" placeholder="Dict Code" clearable style="width: 160px" />
        <el-input v-model="search.dictLabel" placeholder="Dict Label" clearable style="width: 160px" />
        <el-button type="primary" @click="handleSearch">Search</el-button>
        <el-button type="primary" @click="handleAdd">Add</el-button>
      </div>
    </div>
    <el-table :data="dictList" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="dictType" label="Type" />
      <el-table-column prop="dictCode" label="Code" />
      <el-table-column prop="dictLabel" label="Label" />
      <el-table-column prop="dictValue" label="Value" />
      <el-table-column prop="sort" label="Sort" width="80" />
      <el-table-column prop="lang" label="Lang" width="80" />
      <el-table-column label="Action" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">Edit</el-button>
          <el-button type="danger" link @click="handleDelete(row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? 'Add Dictionary' : 'Edit Dictionary'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="Type" prop="dictType">
          <el-input v-model="form.dictType" placeholder="Type" />
        </el-form-item>
        <el-form-item label="Code" prop="dictCode">
          <el-input v-model="form.dictCode" placeholder="Code" />
        </el-form-item>
        <el-form-item label="Label" prop="dictLabel">
          <el-input v-model="form.dictLabel" placeholder="Label" />
        </el-form-item>
        <el-form-item label="Value" prop="dictValue">
          <el-input v-model="form.dictValue" placeholder="Value" />
        </el-form-item>
        <el-form-item label="Sort" prop="sort">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="Lang" prop="lang">
          <el-input v-model="form.lang" placeholder="Lang" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="handleSave">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { fetchDictPage, createDictItem, updateDictItem, deleteDictItem } from '@/api/dict';
import type { DictItem } from '../types/dict';
import { ElMessage, ElMessageBox } from 'element-plus';

const dictList = ref<DictItem[]>([]);
const loading = ref(false);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(10);
const dialogVisible = ref(false);
const dialogType = ref<'add' | 'edit'>('add');
const formRef = ref();
const form = reactive<Partial<DictItem>>({
  dictType: '',
  dictCode: '',
  dictLabel: '',
  dictValue: '',
  sort: 1,
  lang: 'zh',
});
const rules = {
  dictType: [{ required: true, message: 'Type is required', trigger: 'blur' }],
  dictCode: [{ required: true, message: 'Code is required', trigger: 'blur' }],
  dictLabel: [{ required: true, message: 'Label is required', trigger: 'blur' }],
  dictValue: [{ required: true, message: 'Value is required', trigger: 'blur' }],
};
const search = reactive({ dictType: '', dictCode: '', dictLabel: '' });

function loadData() {
  loading.value = true;
  fetchDictPage({
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    ...search,
  }).then(res => {
    dictList.value = res.data.list;
    total.value = res.data.total;
  }).finally(() => {
    loading.value = false;
  });
}

function handleSearch() {
  pageNum.value = 1;
  loadData();
}

function handleSizeChange(size: number) {
  pageSize.value = size;
  loadData();
}

function handleCurrentChange(page: number) {
  pageNum.value = page;
  loadData();
}

function handleAdd() {
  dialogType.value = 'add';
  Object.assign(form, { dictType: '', dictCode: '', dictLabel: '', dictValue: '', sort: 1, lang: 'zh' });
  dialogVisible.value = true;
}

function handleEdit(row: DictItem) {
  dialogType.value = 'edit';
  Object.assign(form, row);
  dialogVisible.value = true;
}

function handleSave() {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    if (dialogType.value === 'add') {
      // 保证 sort 字段为 number 类型且有默认值
      const payload = {
        dictType: form.dictType || '',
        dictCode: form.dictCode || '',
        dictLabel: form.dictLabel || '',
        dictValue: form.dictValue || '',
        sort: typeof form.sort === 'number' ? form.sort : 1,
        lang: form.lang || 'zh',
      };
      await createDictItem(payload);
      ElMessage.success('Added successfully');
    } else {
      await updateDictItem(form as DictItem);
      ElMessage.success('Updated successfully');
    }
    dialogVisible.value = false;
    loadData();
  });
}

function handleDelete(row: DictItem) {
  ElMessageBox.confirm('Are you sure to delete this item?', 'Warning', { type: 'warning' })
    .then(async () => {
      await deleteDictItem(row.id);
      ElMessage.success('Deleted successfully');
      loadData();
    });
}

onMounted(loadData);
</script>

<style scoped>
.dict-container { padding: 24px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.pagination { margin-top: 16px; text-align: right; }
</style> 