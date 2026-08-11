<template>
  <div class="page">
    <div class="page-header">
      <div class="title">颜色配置</div>
    </div>

    <el-card class="card">
      <template #header><div class="section-title">系统默认颜色</div></template>
      <el-table :data="systemDefaultColors" border>
        <el-table-column prop="name" label="英文名" min-width="140" />
        <el-table-column prop="nameCn" label="中文名" min-width="120" />
        <el-table-column prop="hex" label="HEX" width="110" />
        <el-table-column label="颜色预览" class-name="color-cell" width="120">
          <template #default="{ row }">
            <div class="preview fill" :style="previewStyle(row.hex)"></div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="card">
      <template #header><div class="section-title">Garmin 颜色选项</div></template>
      <el-table :data="groupedColors" border>
        <el-table-column v-for="columnIndex in 4" :key="columnIndex" :label="String(columnIndex)" align="center">
          <el-table-column label="英文名" width="140px">
            <template #default="{ row }">{{ row[columnIndex - 1]?.name || '' }}</template>
          </el-table-column>
          <el-table-column label="中文名" width="110px">
            <template #default="{ row }">{{ row[columnIndex - 1]?.nameCn || '' }}</template>
          </el-table-column>
          <el-table-column label="HEX" width="100px">
            <template #default="{ row }">{{ row[columnIndex - 1]?.hex || '' }}</template>
          </el-table-column>
          <el-table-column label="预览" class-name="color-cell" width="70px">
            <template #default="{ row }">
              <div v-if="row[columnIndex - 1]" class="preview fill" :style="previewStyle(row[columnIndex - 1].hex)"></div>
            </template>
          </el-table-column>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ColorRow = { hex: string; name: string; nameCn: string }

const colors: ColorRow[] = [
  { hex: '#000000', name: 'Black', nameCn: '黑色' },
  { hex: '#000055', name: 'Navy Blue', nameCn: '海军蓝' },
  { hex: '#0000AA', name: 'Dark Blue', nameCn: '深蓝色' },
  { hex: '#0000FF', name: 'Blue', nameCn: '蓝色' },
  { hex: '#005500', name: 'Darkest Green', nameCn: '墨绿色' },
  { hex: '#005555', name: 'Sherpa Blue', nameCn: '夏尔巴蓝' },
  { hex: '#0055AA', name: 'Cobalt', nameCn: '钴蓝色' },
  { hex: '#0055FF', name: 'Denim Blue', nameCn: '牛仔蓝' },
  { hex: '#00AA00', name: 'Green', nameCn: '绿色' },
  { hex: '#00AA55', name: 'Green Haze', nameCn: '绿雾色' },
  { hex: '#00AAAA', name: 'Persian Green', nameCn: '波斯绿' },
  { hex: '#00AAFF', name: 'Azure', nameCn: '天蓝色' },
  { hex: '#00FF00', name: 'Bright Green', nameCn: '亮绿色' },
  { hex: '#00FF55', name: 'Spring Green', nameCn: '春绿色' },
  { hex: '#00FFAA', name: 'Bright Aquamarine', nameCn: '亮碧绿色' },
  { hex: '#00FFFF', name: 'Cyan', nameCn: '青色' },
  { hex: '#550000', name: 'Maroon', nameCn: '栗色' },
  { hex: '#550055', name: 'Tyrian Purple', nameCn: '泰尔紫' },
  { hex: '#5500AA', name: 'Purple', nameCn: '紫色' },
  { hex: '#5500FF', name: 'Electric Indigo', nameCn: '电光靛蓝' },
  { hex: '#555500', name: 'Verdun Green', nameCn: '凡尔登绿' },
  { hex: '#555555', name: 'Dark Gray', nameCn: '深灰色' },
  { hex: '#5555AA', name: 'Rich Blue', nameCn: '浓蓝色' },
  { hex: '#5555FF', name: 'Neon Blue', nameCn: '霓虹蓝' },
  { hex: '#55AA00', name: 'Limeade', nameCn: '青柠绿' },
  { hex: '#55AA55', name: 'Fruit Salad', nameCn: '果绿色' },
  { hex: '#55AAAA', name: 'Tradewind Blue', nameCn: '信风蓝' },
  { hex: '#55AAFF', name: 'Maya Blue', nameCn: '玛雅蓝' },
  { hex: '#55FF00', name: 'Bright Lime', nameCn: '亮青柠色' },
  { hex: '#55FF55', name: 'Screamin Green', nameCn: '荧光绿' },
  { hex: '#55FFAA', name: 'Aquamarine', nameCn: '碧绿色' },
  { hex: '#55FFFF', name: 'Baby Blue', nameCn: '婴儿蓝' },
  { hex: '#AA0000', name: 'Dark Red', nameCn: '深红色' },
  { hex: '#AA0055', name: 'Lipstick', nameCn: '口红色' },
  { hex: '#AA00AA', name: 'Dark Magenta', nameCn: '深洋红' },
  { hex: '#AA00FF', name: 'Violet', nameCn: '紫罗兰色' },
  { hex: '#AA5500', name: 'Tawny Orange', nameCn: '黄褐橙' },
  { hex: '#AA5555', name: 'Blossom Red', nameCn: '花红色' },
  { hex: '#AA55AA', name: 'Tapestry Purple', nameCn: '织锦紫' },
  { hex: '#AA55FF', name: 'Pale Violet', nameCn: '淡紫色' },
  { hex: '#AAAA00', name: 'Citrus', nameCn: '柑橘黄' },
  { hex: '#AAAA55', name: 'Olive Green', nameCn: '橄榄绿' },
  { hex: '#AAAAAA', name: 'Light Gray', nameCn: '浅灰色' },
  { hex: '#AAAAFF', name: 'Lavender', nameCn: '薰衣草紫' },
  { hex: '#AAFF00', name: 'Lime', nameCn: '青柠色' },
  { hex: '#AAFF55', name: 'Green Yellow', nameCn: '黄绿色' },
  { hex: '#AAFFAA', name: 'Mint', nameCn: '薄荷绿' },
  { hex: '#AAFFFF', name: 'Pale Blue', nameCn: '淡蓝色' },
  { hex: '#FF0000', name: 'Red', nameCn: '红色' },
  { hex: '#FF0055', name: 'Torch Red', nameCn: '火炬红' },
  { hex: '#FF00AA', name: 'Pink', nameCn: '粉色' },
  { hex: '#FF00FF', name: 'Magenta', nameCn: '洋红色' },
  { hex: '#FF5500', name: 'Strong Orange', nameCn: '鲜橙色' },
  { hex: '#FF5555', name: 'Tomato', nameCn: '番茄红' },
  { hex: '#FF55AA', name: 'Brilliant Rose', nameCn: '亮玫红' },
  { hex: '#FF55FF', name: 'Flamingo', nameCn: '火烈鸟粉' },
  { hex: '#FFAA00', name: 'Orange', nameCn: '橙色' },
  { hex: '#FFAA55', name: 'Pale Orange', nameCn: '淡橙色' },
  { hex: '#FFAAAA', name: 'Lilac', nameCn: '丁香紫' },
  { hex: '#FFAAFF', name: 'Rose', nameCn: '玫瑰色' },
  { hex: '#FFFF00', name: 'Yellow', nameCn: '黄色' },
  { hex: '#FFFF55', name: 'Lemon', nameCn: '柠檬黄' },
  { hex: '#FFFFAA', name: 'Canary', nameCn: '金丝雀黄' },
  { hex: '#FFFFFF', name: 'White', nameCn: '白色' },
]

const systemDefaultColorHexes = [
  '#FFFFFF',
  '#000000',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FFAA00',
  '#5500AA',
]

const systemDefaultColors = computed(() =>
  systemDefaultColorHexes.map((hex) => colors.find((color) => color.hex === hex)!),
)

const groupedColors = computed(() => {
  const out: ColorRow[][] = []
  for (let i = 0; i < colors.length; i += 4) {
    out.push(colors.slice(i, i + 4))
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
.section-title { font-size: 16px; font-weight: 600; }
.card { overflow: hidden; }

/* remove padding for the color preview column cells so preview fills the cell */
:deep(td.color-cell) .cell { padding: 0 !important; }
.preview.fill { width: 100%; height: 100%; min-height: 24px; }

:deep(.el-table .el-table__body-wrapper .el-table__body td.el-table__cell) { padding: 0 !important; }
</style>
