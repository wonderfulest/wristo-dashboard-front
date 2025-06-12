<template>
  <div class="add-product-drawer">
    <div class="drawer-header">
      <h2>Add New Product</h2>
    </div>
    <div class="drawer-body">
      <div class="section-title-row">
        <span class="section-title">Product Image</span>
        <el-button
          class="help-btn"
          type="info"
          circle
          size="small"
          @click="showTip = !showTip"
        >
          <el-icon><i class="el-icon-question" /></el-icon>
        </el-button>
      </div>
      <el-tooltip
        v-if="showTip"
        effect="light"
        placement="bottom"
        :show-after="0"
        :hide-after="100"
        :visible="true"
        :popper-style="{maxWidth: '400px', whiteSpace: 'normal', lineHeight: '1.2'}"
      >
        <template #content>
          <div class="section-desc">
            Upload an image for the platform that this product is available for.<br>
            Leave blank if your product doesn't support that platform. Customers will view this before purchasing.<br>
            We recommend using the same preview you used in the Garmin store.
          </div>
        </template>
        <span></span>
      </el-tooltip>
    
      <div class="platform-img-row">
        <div
          class="platform-img-block"
          v-for="platform in platforms"
          :key="platform.key"
        >
          <div class="platform-label">{{ platform.label }}</div>
          <el-upload
            class="img-uploader"
            drag
            :show-file-list="false"
            :on-change="(file: any) => handleImageChange(file, platform.key)"
            :before-upload="() => false"
          >
            <div v-if="!form[platform.imgField]" class="img-upload-placeholder">
              <el-icon><i class="el-icon-picture" /></el-icon>
              <div>Add Preview</div>
            </div>
            <img v-else :src="form[platform.imgField]" class="img-preview" />
          </el-upload>
        </div>
      </div>
      <div class="custom-form">
        <div
          v-for="item in inputItems"
          :key="item.key"
          class="custom-form-item"
          :style="item.key === 'trialLasts' || item.key === 'price' ? 'display: flex; align-items: center;' : ''"
        >
          <label
            :class="['custom-label', { active: isActive(item.key) || form[item.key] }]"
            >{{ item.label }}</label
          >
          <input
            :type="item.type || 'text'"
            v-model="form[item.key]"
            :placeholder="item.placeholder"
            class="custom-input"
            @focus="activeInput = item.key"
            @blur="activeInput = ''"
            autocomplete="off"
            :style="item.key === 'trialLasts' || item.key === 'price' ? 'flex: 1;' : ''"
            :data-short-underline="item.key === 'trialLasts' || item.key === 'price' ? true : null"
          />
          <span
            v-if="item.key === 'trialLasts'"
            style="margin-left: 8px; color: #888; font-size: 1.1rem; margin-top: 10px;"
            >Hours</span
          >
          <span
            v-if="item.key === 'price'"
            style="margin-left: 8px; color: #888; font-size: 1.1rem; margin-top: 10px;"
            >USD</span
          >
          <div
            v-if="item.tip && activeInput === item.key"
            class="custom-tip-right"
          >
            {{ item.tip }}
          </div>
        </div>
      </div>
    </div>
    <div class="drawer-footer">
      <el-checkbox v-model="checked" class="footer-checkbox">
        <el-tooltip
          effect="dark"
          placement="top"
          :content="fullAgreement"
          :show-after="200"
          :hide-after="100"
          :popper-style="{maxWidth: '400px', whiteSpace: 'normal', lineHeight: '1.2'}"
        >
          <span class="footer-checkbox-text" style="cursor: pointer;">
            Agree to the terms
          </span>
        </el-tooltip>
      </el-checkbox>
      <el-button
        type="success"
        class="create-btn"
        size="large"
        :disabled="!checked || loading"
        @click="props.product ? handleSave() : handleCreate()"
      >
        {{ props.product ? 'Save' : 'CREATE PRODUCT' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineExpose, defineProps, watch } from "vue";
import { createProduct, updateProduct, type Product, uploadProductImage } from '@/api/products'
import { ElMessage } from 'element-plus'
import { defineEmits } from 'vue'
import type { ApiResponse } from '@/types/api';

const props = defineProps<{ product?: Product | null }>()

const showTip = ref(false);
const activeInput = ref("");

const platforms = [{ key: "garmin", label: "Garmin", imgField: "garminImg" }];

interface AddProductForm {
  garminImg: string;
  name: string;
  description: string;
  price: string;
  garminUrl: string;
  trialLasts: string;
  [key: string]: any;
}

const form = ref<AddProductForm>({
  garminImg: "",
  name: "",
  description: "",
  price: "",
  garminUrl: "",
  trialLasts: "",
});

const checked = ref(false);

const loading = ref(false);
const emits = defineEmits(['close'])

const fullAgreement = `By clicking this box, you represent and warrant that you have all necessary rights, including all patent, trademark, trade secret, copyright or other intellectual property, publicity, or other proprietary rights, in and to this product. Do not check this box unless you own all such rights or have sufficient permission from their rightful owner(s) to use the material for commercial purposes.\n\nIf you check this box and it turns out you do not have all necessary rights, any and all damages coming from this violation will be charged to you in full.`;

const inputItems = [
  {
    key: "name",
    label: "Name of Product",
    placeholder: "",
    type: "text",
    tip: "Enter the name of the product.",
  },
  { key: "description", label: "Description for Product", placeholder: "" },
  {
    key: "price",
    label: "Price of Product",
    placeholder: "",
    type: "text",
    tip: "Enter the price of the product.",
  },
  {
    key: "garminUrl",
    label: "Garmin Appstore Url",
    placeholder: "",
    type: "text",
    tip: "If this product is available for Garmin smartwatches, enter the Garmin appstore URL which allows customers to install the app here.",
  },
  {
    key: "trialLasts",
    label: "Trial Lasts",
    placeholder: "",
    type: "text",
    tip: "Enter the number of hours the trial will last. Leave blank if you do not want to offer a trial. support 0 means no trial, 0.5 means 0.5 hours.",
  },
  {
    key: "contactUrl",
    label: "Product FAQ & Contact Page",
    placeholder: "",
    type: "text",
  },
];

function handleImageChange(file: any, key: string) {
  if (!file || !file.raw) return;
  loading.value = true;
  uploadProductImage(file.raw, 'hero', file.raw.type.split('/')[1] || 'png')
    .then((res: any) => {
      if (res.code === 0 && res.data) {
        form.value[`${key}Img`] = res.data;
        ElMessage.success('图片上传成功');
      } else {
        ElMessage.error(res.msg || '图片上传失败');
      }
    })
    .catch(() => {
      ElMessage.error('图片上传失败');
    })
    .finally(() => {
      loading.value = false;
    });
}

function isActive(key: string) {
  return activeInput.value === key;
}

function validateForm() {
  if (!form.value.name.trim()) {
    ElMessage.error('Product name is required');
    return false;
  }
  if (!form.value.description.trim()) {
    ElMessage.error('Product description is required');
    return false;
  }
  if (form.value.price && isNaN(Number(form.value.price))) {
    ElMessage.error('Price must be a number');
    return false;
  }
  if (form.value.trialLasts && isNaN(Number(form.value.trialLasts))) {
    ElMessage.error('Trial Lasts must be a number');
    return false;
  }
  return true;
}

async function handleCreate() {
  if (!checked.value) {
    ElMessage.error('You must agree to the terms');
    return;
  }
  if (!validateForm()) return;
  loading.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      garminImageUrl: form.value.garminImg || '',
      garminStoreUrl: form.value.garminUrl || '',
      trialLasts: form.value.trialLasts ? Number(form.value.trialLasts) : 0,
      price: form.value.price ? Number(form.value.price) : 0,
    };
    const res: ApiResponse<Product> = await createProduct(payload);
    if (res.code === 0) {
      ElMessage.success('Product created successfully');
      emits('close');
    } else {
      ElMessage.error(res.msg || 'Create failed');
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || 'Create failed');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.value = {
    garminImg: "",
    name: "",
    description: "",
    price: "",
    garminUrl: "",
    trialLasts: "",
  };
  checked.value = false;
  // 其他需要重置的状态
}

function setForm(product: Product) {
  form.value = {
    garminImg: product.garminImageUrl || "",
    name: product.name || "",
    description: product.description || "",
    price: product.price != null ? String(product.price) : "",
    garminUrl: product.garminStoreUrl || "",
    trialLasts: product.trialLasts != null ? String(product.trialLasts) : "",
    contactUrl: product.appId != null ? "https://wristo.io/contact/" +  product.appId : ""
  };
  checked.value = true;
}

defineExpose({ resetForm, setForm });

// 监听 prop product 变化自动填充
watch(() => props.product, (val) => {
  if (val) setForm(val);
  else resetForm();
});

// const productDrawerVisible = ref(false)
// const currentProduct = ref<Product | null>(null)

// const handleProductClick = async (appId: number) => {
//   const res = await getProduct(appId)
//   if (res.code === 0 && res.data) {
//     currentProduct.value = res.data
//     productDrawerVisible.value = true
//   }
// }

async function handleSave() {
  if (!props.product) return
  if (!validateForm()) return
  loading.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      garminImageUrl: form.value.garminImg || '',
      garminStoreUrl: form.value.garminUrl || '',
      trialLasts: form.value.trialLasts ? Number(form.value.trialLasts) : 0,
      price: form.value.price ? Number(form.value.price) : 0,
    }
    const res = await updateProduct(props.product.appId, payload)
    if (res.code === 0) {
      ElMessage.success('Product updated successfully')
      emits('close')
    } else {
      ElMessage.error(res.msg || 'Update failed')
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || 'Update failed')
  } finally {
    loading.value = false
  }
}

</script>

<style scoped>
.add-product-drawer {
  background: #fff;
  min-height: 100vh;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-radius: 12px 0 0 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.drawer-header {
  background: #19b36b;
  color: #fff;
  padding: 36px 0 24px 0;
  text-align: center;
}

.drawer-header h2 {
  font-size: 2.4rem;
  font-weight: 400;
  margin: 0;
  letter-spacing: 1px;
}

.drawer-body {
  padding: 36px 32px 0 32px;
  flex: 1 1 auto;
  overflow-y: auto;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0;
  color: #222;
}

.section-desc {
  color: #444;
  font-size: 1rem;
  margin-bottom: 12px;
  line-height: 1.2;
  text-align: center;
}

.platform-img-row {
  display: flex;
  gap: 18px;
  margin-bottom: 24px;
}

.platform-img-block {
  flex: 1;
  text-align: center;
}

.platform-label {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 8px;
  color: #222;
}

.img-uploader {
  width: 120px;
  height: 120px;
  border: 2px dashed #b2b2b2;
  border-radius: 10px;
  background: #fafbfc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  margin-bottom: 8px;
  transition: border-color 0.2s;
  position: relative;
  overflow: hidden;
}

.img-uploader:hover {
  border-color: #19b36b;
}

.img-upload-placeholder {
  color: #bbb;
  font-size: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.img-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  margin: auto;
}

.custom-form {
  margin-top: 18px;
}

.custom-form-item {
  position: relative;
  margin-bottom: 32px;
}

.custom-label {
  position: absolute;
  left: 0px;
  top: 18px;
  font-size: 1.1rem;
  color: #bbb;
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.custom-label.active {
  top: -14px;
  left: -4px;
  font-size: 0.98rem;
  color: #19b36b;
  background: #fff;
  padding: 0 4px;
  font-weight: 600;
}

.custom-input {
  width: 100%;
  border: none;
  border-bottom: 2px solid #e0e0e0;
  outline: none;
  font-size: 1.15rem;
  padding: 18px 0 6px 0;
  background: transparent;
  color: #222;
  transition: border-color 0.2s, border-width 0.2s;
}

.custom-input:focus {
  border-bottom: 3px solid #19b36b;
}

.custom-textarea {
  resize: none;
  min-height: 48px;
}

.custom-tip-right {
  position: absolute;
  top: 0;
  right: 0;
  transform: translateY(-110%);
  background: #5c5a5a;
  color: #fff;
  font-size: 1.05rem;
  border-radius: 8px;
  padding: 12px 18px;
  min-width: 260px;
  max-width: 340px;
  z-index: 10;
  text-align: left;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.13);
  line-height: 1.5;
  font-weight: 500;
  pointer-events: none;
  white-space: normal;
}

.drawer-footer {
  padding: 32px 32px 24px 32px;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 24px;
  border-radius: 0 0 0 12px;
}

.footer-checkbox {
  align-items: flex-start;
  margin-bottom: 0;
  display: flex;
  align-items: center;
}

.footer-checkbox-text {
  font-size: 1.15rem;
  color: #222;
  line-height: 1.2;
  word-break: break-word;
  white-space: normal;
  overflow-x: hidden;
}

.create-btn {
  width: 100%;
  height: 48px;
  font-size: 1.3rem;
  font-weight: bold;
  letter-spacing: 1px;
  background: #19b36b;
  border: none;
  border-radius: 6px;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: background 0.2s;
}

.create-btn:disabled {
  background: #b2dfc7;
  color: #fff;
  cursor: not-allowed;
}

.help-btn {
  padding: 0;
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e9ecef;
  border-radius: 50%;
  border: none;
  color: #19b36b;
  transition: background 0.2s;
}

.help-btn:hover {
  background: #d2f4e3;
  color: #19b36b;
}

:deep(.el-upload-dragger) {
  all: unset !important;
  /* 你可以在这里添加自己的样式 */
}

/* 针对 trialLasts 和 price，缩短下划线宽度 */
input[data-short-underline] {
  width: 80px !important;
  min-width: 0;
  display: inline-block;
}
</style>

<style>
.el-drawer {
  --el-drawer-padding-primary: 0 !important;
}
.el-upload-dragger {
  border: none !important;
}
</style>
