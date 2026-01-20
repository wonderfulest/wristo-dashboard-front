<template>
  <div class="delete-garmin-container">
    <div class="header">
      <h2>从佳明应用商城删除</h2>
      <p class="desc">
        使用下方搜索选择一个应用，确认后将从佳明应用商城删除，并同步清理该应用在本系统中的 Garmin UUID 和商店链接。
      </p>
    </div>

    <div class="search-section">
      <span class="label">选择应用：</span>
      <AppSearchSelect
        v-model="selectedAppId"
        placeholder="搜索应用（按名称）"
        width="420px"
        @selected="handleProductSelected"
      />
    </div>

    <div v-if="selectedProduct" class="info-card">
      <h3>应用信息</h3>
      <div class="info-main">
        <div class="info-left">
          <div class="info-row">
            <span class="info-label">App ID：</span>
            <span>{{ selectedProduct.appId }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">名称：</span>
            <span>{{ selectedProduct.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">设计ID：</span>
            <span>{{ selectedProduct.designId || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Garmin UUID：</span>
            <span>{{ selectedProduct.garminAppUuid || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">佳明商店链接：</span>
            <span v-if="selectedProduct.garminStoreUrl">
              <a
                :href="selectedProduct.garminStoreUrl"
                class="store-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ selectedProduct.garminStoreUrl }}
              </a>
            </span>
            <span v-else class="placeholder">-</span>
          </div>
        </div>
        <div class="info-right">
          <AppProductInfo :product="selectedProduct" :thumb-size="120" />
        </div>
      </div>

      <div class="danger-zone">
        <el-popconfirm
          title="确定要从佳明应用商城删除该应用，并同步清理 UUID 和商店链接吗？此操作不可逆。"
          confirm-button-text="确定删除"
          cancel-button-text="取消"
          width="420px"
          @confirm="handleDelete"
        >
          <template #reference>
            <el-button
              type="danger"
              :disabled="!selectedProduct || deleting"
              :loading="deleting"
            >
              从佳明商城删除并清理 UUID / URL
            </el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <div v-else class="empty-tip">
      请选择一个应用后查看详情并执行删除操作。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import AppProductInfo from '@/components/common/AppProductInfo.vue'
import type { Product } from '@/types/product'
import { deleteProductFromGarmin } from '@/api/products'

const selectedAppId = ref<number | null | undefined>(undefined)
// 这里用 any 以兼容 AppProductInfo 对 ProductBase 的宽松要求，避免 heroFile 类型差异导致的 TS 报错
const selectedProduct = ref<any | null>(null)
const deleting = ref(false)

const handleProductSelected = (p: Product) => {
  selectedProduct.value = p
  selectedAppId.value = p.appId
}

const handleDelete = async () => {
  if (!selectedProduct.value) return
  try {
    deleting.value = true
    const res = await deleteProductFromGarmin(selectedProduct.value.appId)
    if (res.code === 0 && res.data) {
      ElMessage.success('已从佳明应用商城删除，并同步清理 UUID 和商店链接')
      // 删除成功后清空选择，避免重复误操作
      selectedProduct.value = null
      selectedAppId.value = undefined
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error) {
    ElMessage.error('删除失败')
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped lang="scss">
.delete-garmin-container {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header {
  margin-bottom: 20px;

  h2 {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
  }

  .desc {
    margin: 0;
    color: #909399;
    font-size: 13px;
  }
}

.search-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;

  .label {
    font-size: 14px;
    color: #606266;
    white-space: nowrap;
  }
}

.info-card {
  padding: 16px 20px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  background-color: #f9fafc;

  h3 {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
  }
}

.info-main {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.info-left {
  flex: 1;
}

.info-right {
  flex-shrink: 0;
}

.info-row {
  display: flex;
  margin-bottom: 6px;
  font-size: 13px;

  .info-label {
    width: 110px;
    color: #909399;
  }

  .placeholder {
    color: #c0c4cc;
    font-style: italic;
  }
}

.store-link {
  color: #409eff;
  text-decoration: underline;
  word-break: break-all;
}

.danger-zone {
  margin-top: 20px;
}

.empty-tip {
  margin-top: 16px;
  color: #909399;
  font-size: 13px;
}
</style>
