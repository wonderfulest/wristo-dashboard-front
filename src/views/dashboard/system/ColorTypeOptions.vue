<template>
  <div class="page">
    <div class="page-header">
      <div class="title">颜色配置</div>
    </div>

    <el-card class="card">
      <el-table :data="groupedColors" border>
        <el-table-column label="1" align="center">
          <el-table-column label="name" width="140px">
            <template #default="{ row }">{{ row[0]?.name || '' }}</template>
          </el-table-column>
          <el-table-column label="HEX" width="100px">
            <template #default="{ row }">{{ row[0]?.hex || '' }}</template>
          </el-table-column>
          <el-table-column label="preview" class-name="color-cell" width="80px">
            <template #default="{ row }">
              <div v-if="row[0]" class="preview fill" :style="previewStyle(row[0].hex)"></div>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column label="2" align="center">
          <el-table-column label="name" width="140px">
            <template #default="{ row }">{{ row[1]?.name || '' }}</template>
          </el-table-column>
          <el-table-column label="HEX" width="100px">
            <template #default="{ row }">{{ row[1]?.hex || '' }}</template>
          </el-table-column>
          <el-table-column label="preview" class-name="color-cell" width="80px">
            <template #default="{ row }">
              <div v-if="row[1]" class="preview fill" :style="previewStyle(row[1].hex)"></div>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column label="3" align="center">
          <el-table-column label="name" width="140px">
            <template #default="{ row }">{{ row[2]?.name || '' }}</template>
          </el-table-column>
          <el-table-column label="HEX" width="100px">
            <template #default="{ row }">{{ row[2]?.hex || '' }}</template>
          </el-table-column>
          <el-table-column label="preview" class-name="color-cell" width="80px">
            <template #default="{ row }">
              <div v-if="row[2]" class="preview fill" :style="previewStyle(row[2].hex)"></div>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column label="4" align="center">
          <el-table-column label="name" width="140px">
            <template #default="{ row }">{{ row[3]?.name || '' }}</template>
          </el-table-column>
          <el-table-column label="HEX" width="100px">
            <template #default="{ row }">{{ row[3]?.hex || '' }}</template>
          </el-table-column>
          <el-table-column label="preview" class-name="color-cell" width="80px">
            <template #default="{ row }">
              <div v-if="row[3]" class="preview fill" :style="previewStyle(row[3].hex)"></div>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

type ColorRow = { hex: string; name: string }

const colors = ref<ColorRow[]>([
  { hex: '#000000', name: 'Black' },
  { hex: '#000055', name: 'Navy Blue' },
  { hex: '#0000AA', name: 'Dark Blue' },
  { hex: '#0000FF', name: 'Blue' },
  { hex: '#005500', name: 'Darkest Green' },
  { hex: '#005555', name: 'Sherpa Blue' },
  { hex: '#0055AA', name: 'Cobalt' },
  { hex: '#0055FF', name: 'Denim Blue' },
  { hex: '#00AA00', name: 'Green' },
  { hex: '#00AA55', name: 'Green Haze' },
  { hex: '#00AAAA', name: 'Persian Green' },
  { hex: '#00AAFF', name: 'Azure' },
  { hex: '#00FF00', name: 'Bright Green' },
  { hex: '#00FF55', name: 'Spring Green' },
  { hex: '#00FFAA', name: 'Bright Aquamarine' },
  { hex: '#00FFFF', name: 'Cyan' },
  { hex: '#550000', name: 'Maroon' },
  { hex: '#550055', name: 'Tyrian Purple' },
  { hex: '#5500AA', name: 'Purple' },
  { hex: '#5500FF', name: 'Electric Indigo' },
  { hex: '#555500', name: 'Verdun Green' },
  { hex: '#555555', name: 'Dark Gray' },
  { hex: '#5555AA', name: 'Rich Blue' },
  { hex: '#5555FF', name: 'Neon Blue' },
  { hex: '#55AA00', name: 'Limeade' },
  { hex: '#55AA55', name: 'Fruit Salad' },
  { hex: '#55AAAA', name: 'Tradewind Blue' },
  { hex: '#55AAFF', name: 'Maya Blue' },
  { hex: '#55FF00', name: 'Bright Lime' },
  { hex: '#55FF55', name: 'Screamin Green' },
  { hex: '#55FFAA', name: 'Aquamarine' },
  { hex: '#55FFFF', name: 'Baby Blue' },
  { hex: '#AA0000', name: 'Dark Red' },
  { hex: '#AA0055', name: 'Lipstick' },
  { hex: '#AA00AA', name: 'Dark Magenta' },
  { hex: '#AA00FF', name: 'Violet' },
  { hex: '#AA5500', name: 'Tawny Orange' },
  { hex: '#AA5555', name: 'Blossom Red' },
  { hex: '#AA55AA', name: 'Tapestry Purple' },
  { hex: '#AA55FF', name: 'Pale Violet' },
  { hex: '#AAAA00', name: 'Citrus' },
  { hex: '#AAAA55', name: 'Olive Green' },
  { hex: '#AAAAAA', name: 'Light Gray' },
  { hex: '#AAAAFF', name: 'Lavender' },
  { hex: '#AAFF00', name: 'Lime' },
  { hex: '#AAFF55', name: 'Green Yellow' },
  { hex: '#AAFFAA', name: 'Mint' },
  { hex: '#AAFFFF', name: 'Pale Blue' },
  { hex: '#FF0000', name: 'Red' },
  { hex: '#FF0055', name: 'Torch Red' },
  { hex: '#FF00AA', name: 'Pink' },
  { hex: '#FF00FF', name: 'Magenta' },
  { hex: '#FF5500', name: 'Strong Orange' },
  { hex: '#FF5555', name: 'Tomato' },
  { hex: '#FF55AA', name: 'Brilliant Rose' },
  { hex: '#FF55FF', name: 'Flamingo' },
  { hex: '#FFAA00', name: 'Orange' },
  { hex: '#FFAA55', name: 'Pale Orange' },
  { hex: '#FFAAAA', name: 'Lilac' },
  { hex: '#FFAAFF', name: 'Rose' },
  { hex: '#FFFF00', name: 'Yellow' },
  { hex: '#FFFF55', name: 'Lemon' },
  { hex: '#FFFFAA', name: 'Canary' },
  { hex: '#FFFFFF', name: 'White' },
  // { hex: 'transparent', name: 'Transparent' },
])

const groupedColors = computed(() => {
  const out: ColorRow[][] = []
  for (let i = 0; i < colors.value.length; i += 4) {
    out.push(colors.value.slice(i, i + 4))
  }
  return out
})

const previewStyle = (hex: string) => {
  if (hex === 'transparent') {
    return {
      background: 'repeating-linear-gradient(45deg,#ccc 0 10px,#fff 10px 20px)',
      width: '100%',
      height: '100%',
    }
  }
  return {
    background: hex,
    width: '100%',
    height: '100%',
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 20px; font-weight: 600; }
.card { overflow: hidden; }

/* remove padding for the color preview column cells so preview fills the cell */
:deep(td.color-cell) .cell { padding: 0 !important; }
.preview.fill { width: 100%; height: 100%; min-height: 24px; }

:deep(.el-table .el-table__body-wrapper .el-table__body td.el-table__cell) { padding: 0 !important; }
</style>
