<template>
  <el-popover
    ref="popover"
    trigger="click"
    placement="bottom-start"
    :width="220"
    :show-arrow="false"
    popper-class="table-action-popover"
    @show="open"
    @hide="visible = false"
  >
    <template #reference>
      <el-button
        ref="trigger"
        class="table-action-trigger"
        aria-label="展开行操作"
        aria-haspopup="dialog"
        :aria-expanded="visible"
        title="操作"
        @click.stop
        @keydown.esc.stop="close"
      >
        <el-icon><MoreFilled /></el-icon>
      </el-button>
    </template>
    <div ref="menu" class="table-action-menu" role="dialog" aria-label="行操作" tabindex="-1" @click.stop @keydown.esc.stop="close">
      <slot />
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { MoreFilled } from '@element-plus/icons-vue'
import type { ButtonInstance, PopoverInstance } from 'element-plus'

const popover = ref<PopoverInstance>()
const trigger = ref<ButtonInstance>()
const menu = ref<HTMLElement>()
const visible = ref(false)
const open = async () => {
  visible.value = true
  await nextTick()
  menu.value?.focus()
}
const close = () => {
  popover.value?.hide()
  trigger.value?.$el.focus()
}
</script>

<style>
.table-action-trigger.el-button {
  width: 32px;
  height: 30px;
  padding: 0;
  border-color: var(--el-border-color-lighter);
  font-size: 18px;
}
.table-action-popover.el-popover { padding: 6px; }
.table-action-menu {
  outline: none;
  max-height: min(420px, 60vh);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.table-action-menu:empty::after {
  content: '暂无可用操作';
  padding: 8px 12px;
  color: var(--el-text-color-secondary);
}
/* Existing action groups retain their handlers and conditional rendering. */
.table-action-menu > div:not(.el-switch),
.table-action-menu > div > div:not(.el-switch) {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  gap: 4px !important;
}
.table-action-menu .el-button,
.table-action-menu a {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  min-height: 34px;
  height: auto;
  margin: 0 !important;
  padding: 8px 12px;
  box-sizing: border-box;
  text-align: left;
  white-space: normal;
  line-height: 1.4;
}
.table-action-menu .el-button > span { white-space: normal; }
.table-action-menu .el-button.is-link:hover,
.table-action-menu a:hover { background: var(--el-fill-color-light); }
.table-action-menu .el-switch { margin: 4px 12px !important; }
</style>
