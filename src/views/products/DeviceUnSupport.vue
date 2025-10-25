<template>
  <div class="unsupport-container">
    <div class="header">
      <h2>未支持应用列表</h2>
      <div class="filters">
        <el-select
          v-model="selectedDevice"
          value-key="id"
          placeholder="选择设备型号（支持名称模糊搜索）"
          filterable
          remote
          :remote-method="searchDevices"
          :loading="deviceLoading"
          clearable
          style="width: 320px"
          @visible-change="(v:boolean)=>{ if(v) { searchDevices(searchKeyword); ensureSelectedInOptions() } }"
          @change="onDeviceSelected"
        >
          <el-option
            v-for="d in deviceOptions"
            :key="d.id"
            :label="d.displayName"
            :value="d"
          />
        </el-select>
        <el-select v-model="sortOrder" placeholder="排序" style="width: 180px">
          <el-option label="下载量倒序" value="download:desc" />
          <el-option label="下载量升序" value="download:asc" />
          <el-option label="创建时间倒序" value="created_at:desc" />
          <el-option label="创建时间升序" value="created_at:asc" />
        </el-select>
        <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
      </div>
    </div>

    <el-alert v-if="!deviceId" type="info" show-icon title="请选择设备后进行查询" class="tip" />

    <el-table :data="list" v-loading="loading" style="width: 100%" size="small">
      <el-table-column prop="appId" label="ID" width="80" />
      <el-table-column label="应用" min-width="300">
        <template #default="{ row }">
          <div class="product-info">
            <el-image
              v-if="row.garminImageUrl || row.heroFile?.url"
              :src="row.garminImageUrl || row.heroFile?.url"
              :z-index="5000"
              :preview-src-list="[row.garminImageUrl || row.heroFile?.url]"
              :preview-teleported="true"
              fit="cover"
              class="product-thumb"
              style="width: 48px; height: 48px"
            />
            <div class="product-meta">
              <div class="product-name">
                <a v-if="row.garminStoreUrl" :href="row.garminStoreUrl" target="_blank" rel="noopener noreferrer">{{ row.name }}</a>
                <span v-else>{{ row.name }}</span>
              </div>
              <div class="product-details">
                <span>appId: {{ row.appId }}</span>
                <span>设计ID: {{ row.designId }}</span>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="作者" width="120">
        <template #default="{ row }">{{ row.user?.username || '-' }}</template>
      </el-table-column>
      <el-table-column prop="download" label="下载量" width="100" />
      <el-table-column prop="price" label="价格" width="90">
        <template #default="{ row }">${{ row.price }}</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="onSizeChange"
        @current-change="onPageChange"
      />
    </div>

    
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchUnSupportByDevicePage } from '@/api/products'
import { pageGarminDevices } from '@/api/garmin-device'
import type { Product } from '@/types/product'
import { formatDate } from '@/utils/date'
 

const deviceId = ref<number | null>(null)
const selectedDevice = ref<any | null>(null)
const sortOrder = ref('download:desc')
const loading = ref(false)
const list = ref<Product[]>([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

// device dropdown
const deviceOptions = ref<any[]>([])
const deviceLoading = ref(false)
const searchTimer = ref<number | undefined>(undefined)
const searchKeyword = ref('')

const searchDevices = (query: string) => {
  searchKeyword.value = query
  if (searchTimer.value) window.clearTimeout(searchTimer.value)
  deviceLoading.value = true
  searchTimer.value = window.setTimeout(async () => {
    try {
      const resp = await pageGarminDevices({ pageNum: 1, pageSize: 500, orderBy: 'id:desc', displayName: query || undefined })
      const data: any = (resp as any)?.data
      deviceOptions.value = data?.list || []
      ensureSelectedInOptions()
    } catch {
      deviceOptions.value = []
    } finally {
      deviceLoading.value = false
    }
  }, 300)
}

function ensureSelectedInOptions() {
  if (!selectedDevice.value) return
  const exists = deviceOptions.value?.some((d:any) => d.id === selectedDevice.value.id)
  if (!exists) deviceOptions.value = [selectedDevice.value, ...(deviceOptions.value || [])]
}

function onDeviceSelected(dev: any) {
  console.log('[DeviceUnSupport] Device selected:', dev)
  deviceId.value = dev?.id ?? null
  console.log('[DeviceUnSupport] deviceId set to:', deviceId.value)
  pageNum.value = 1
  fetchList()
}

const fetchList = async () => {
  if (!deviceId.value) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const res = await fetchUnSupportByDevicePage({
      deviceId: deviceId.value!,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      orderBy: sortOrder.value,
    })
    if (res.code === 0) {
      list.value = res.data?.list || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.msg || '获取数据失败')
    }
  } catch (e) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  pageNum.value = 1
  fetchList()
}

const onSizeChange = (val: number) => {
  pageSize.value = val
  fetchList()
}

const onPageChange = (val: number) => {
  pageNum.value = val
  fetchList()
}

 
</script>

<style scoped>
.unsupport-container { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.filters { display: flex; gap: 12px; align-items: center; }
.tip { margin-bottom: 12px; }
.product-info { display: flex; align-items: center; gap: 12px; }
.product-meta { min-width: 0; }
.product-name { font-weight: 600; color: #333; }
.product-thumb { border-radius: 6px; }
.product-details { display: flex; gap: 10px; font-size: 12px; color: #666; }
.pagination { margin-top: 12px; display: flex; justify-content: flex-end; }
</style>
