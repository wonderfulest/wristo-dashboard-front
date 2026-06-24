<template>
  <aside class="side-menu" :class="{ 'is-collapsed': props.collapsed }">
    <button
      type="button"
      class="side-menu-toggle"
      :aria-label="props.collapsed ? '展开菜单' : '收起菜单'"
      :title="props.collapsed ? '展开菜单' : '收起菜单'"
      :aria-expanded="!props.collapsed"
      @click="emit('toggle-collapse')"
    >
      <el-icon class="toggle-icon">
        <component :is="props.collapsed ? Expand : Fold" />
      </el-icon>
    </button>
    <nav v-if="props.collapsed" class="menu-list collapsed-menu-list" aria-label="侧边栏菜单">
      <el-tooltip
        v-for="item in collapsedMenuItems"
        :key="item.key"
        :content="item.title"
        placement="right"
        :show-after="180"
      >
        <router-link
          :to="item.path as string"
          class="menu-item icon-only"
          active-class="active"
          :aria-label="item.title"
        >
          <el-icon class="menu-icon">
            <component :is="resolveMenuIcon(item.icon)" />
          </el-icon>
        </router-link>
      </el-tooltip>
    </nav>
    <nav v-else class="menu-list" aria-label="侧边栏菜单">
      <template v-for="item in activeChildren" :key="item.key">
        <template v-if="item.children && item.children.length">
          <button
            type="button"
            class="menu-group collapsible"
            :aria-expanded="isGroupOpen(item.key)"
            @click="toggleGroup(item.key)"
          >
            <el-icon class="menu-icon group-icon">
              <component :is="resolveMenuIcon(item.icon)" />
            </el-icon>
            <span class="menu-label">{{ item.title }}</span>
            <el-icon class="arrow" :class="{ open: isGroupOpen(item.key) }">
              <ArrowRight />
            </el-icon>
          </button>
          <div v-show="isGroupOpen(item.key)">
            <router-link
              v-for="sub in item.children"
              :key="sub.key"
              :to="sub.path as string"
              class="menu-item"
              active-class="active"
              :aria-label="sub.title"
            >
              <el-icon class="menu-icon">
                <component :is="resolveMenuIcon(sub.icon)" />
              </el-icon>
              <span class="menu-label">{{ sub.title }}</span>
            </router-link>
          </div>
        </template>
        <router-link
          v-else
          :to="item.path as string"
          class="menu-item"
          active-class="active"
          :aria-label="item.title"
        >
          <el-icon class="menu-icon">
            <component :is="resolveMenuIcon(item.icon)" />
          </el-icon>
          <span class="menu-label">{{ item.title }}</span>
        </router-link>
      </template>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Aim,
  ArrowRight,
  Avatar,
  Bell,
  Box,
  Brush,
  BrushFilled,
  ChatDotRound,
  Collection,
  CollectionTag,
  Compass,
  Cpu,
  CreditCard,
  DataAnalysis,
  DataBoard,
  Delete,
  Discount,
  Document,
  DocumentChecked,
  Expand,
  Files,
  Fold,
  FolderOpened,
  Grid,
  Histogram,
  House,
  Key,
  Link,
  Lock,
  MagicStick,
  Message,
  MessageBox,
  Money,
  Monitor,
  Notebook,
  OfficeBuilding,
  Operation,
  Picture,
  Promotion,
  Search,
  Setting,
  Star,
  Tickets,
  Tools,
  TrendCharts,
  User,
  UserFilled,
  View,
  Warning,
} from '@element-plus/icons-vue'
import { isTopMenuActive, topMenus } from '@/config/menu'
import type { SubMenuItem } from '@/config/menu'

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-collapse'): void
}>()

// 动态菜单：根据当前路由选择顶部分组与侧边二级菜单
const route = useRoute()
const activeTop = computed(() => topMenus.find((g) => isTopMenuActive(g, route.path)) || topMenus[0])
const activeChildren = computed(() => activeTop.value?.children || [])
const collapsedMenuItems = computed(() => flattenMenuItems(activeChildren.value))

const menuIconMap = {
  Aim,
  Avatar,
  Bell,
  Box,
  Brush,
  BrushFilled,
  ChatDotRound,
  Collection,
  CollectionTag,
  Compass,
  Cpu,
  CreditCard,
  DataAnalysis,
  DataBoard,
  Delete,
  Discount,
  Document,
  DocumentChecked,
  Expand,
  Files,
  Fold,
  FolderOpened,
  Grid,
  Histogram,
  House,
  Key,
  Link,
  Lock,
  MagicStick,
  Message,
  MessageBox,
  Money,
  Monitor,
  Notebook,
  OfficeBuilding,
  Operation,
  Picture,
  Promotion,
  Search,
  Setting,
  Star,
  Tickets,
  Tools,
  TrendCharts,
  User,
  UserFilled,
  View,
  Warning,
}

const resolveMenuIcon = (icon?: string) => menuIconMap[icon as keyof typeof menuIconMap] || Grid

const flattenMenuItems = (items: SubMenuItem[]): SubMenuItem[] => {
  return items.flatMap((item) => {
    if (item.path) return [item]
    return item.children ? flattenMenuItems(item.children) : []
  })
}

// Collapsible side group state (默认收起)
const openGroups = ref<Record<string, boolean>>({})
const isGroupOpen = (key: string) => openGroups.value[key] === true
const toggleGroup = (key: string) => {
  openGroups.value[key] = !isGroupOpen(key)
}

// 初始化：默认全部收起，仅当前路由所在分组展开
watch(
  () => ({ route: route.path, items: activeChildren.value }),
  () => {
    const next: Record<string, boolean> = {}
    for (const item of activeChildren.value as any[]) {
      if (item?.children?.length) {
        const hasActive = item.children.some((sub: any) => sub.path && route.path.startsWith(sub.path))
        // 默认 false，仅当包含当前路由时为 true；若用户已手动操作，则沿用已存在的状态
        next[item.key] = openGroups.value[item.key] ?? hasActive
      }
    }
    openGroups.value = next
  },
  { immediate: true, deep: true }
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.side-menu {
  width: 184px;
  background: #fff;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 100%;
  box-shadow: 2px 0 8px rgba(0,0,0,0.06);
  transition: width 0.2s ease, min-width 0.2s ease;
}
.side-menu.is-collapsed {
  width: 64px;
  min-width: 64px;
}
.side-menu-toggle {
  width: 44px;
  height: 44px;
  padding: 0;
  margin: 10px auto 8px;
  color: #606266;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
.side-menu-toggle:hover,
.side-menu-toggle:focus-visible {
  background: #f0f2f5;
  border-color: #d6dbe3;
  color: #19b36b;
  outline: none;
}
.toggle-icon {
  font-size: 18px;
}
.menu-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 8px 8px 16px;
  text-align: left;
  box-sizing: border-box;
  gap: 2px;
}
.collapsed-menu-list {
  align-items: center;
  gap: 6px;
  padding: 4px 10px 16px;
}
.menu-group {
  padding: 12px 20px 8px;
  color: #606266;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.menu-group.collapsible {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px 12px;
  margin: 4px 0;
  border: 0;
  border-radius: 8px;
  transition: background 0.2s ease, color 0.2s ease;
  background: transparent;
  width: 100%;
  justify-content: flex-start;
  text-align: left;
  min-height: 44px;
}
.menu-group.collapsible:hover {
  background: #f5f7fa;
  color: #409eff;
}
.menu-group.collapsible:focus-visible,
.menu-item:focus-visible {
  outline: 2px solid rgba(25, 179, 107, 0.35);
  outline-offset: 2px;
}
.menu-group .arrow {
  display: inline-flex;
  transition: transform 0.2s ease;
  color: #909399;
  font-size: 14px;
  margin-left: auto;
}
.menu-group .arrow.open {
  transform: rotate(90deg);
  color: #409eff;
}
.menu-item {
  min-height: 44px;
  padding: 10px 12px;
  color: #606266;
  text-decoration: none;
  font-size: 13px;
  transition: background 0.2s, color 0.2s;
  border-radius: 8px;
  margin: 2px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  box-sizing: border-box;
}
/* Child menu items under groups */
.menu-group.collapsible + div .menu-item {
  padding-left: 30px;
  font-size: 12px;
  color: #8492a6;
  background: rgba(64, 158, 255, 0.02);
  border-left: 2px solid transparent;
}
.menu-group.collapsible + div .menu-item:hover {
  background: rgba(64, 158, 255, 0.08);
  color: #409eff;
  border-left-color: #409eff;
}
.menu-item.active, .menu-item.router-link-exact-active {
  background: #e8f5e8;
  color: #19b36b;
  font-weight: 600;
}
.menu-item.icon-only {
  width: 44px;
  height: 44px;
  min-height: 44px;
  padding: 0;
  justify-content: center;
  border-radius: 12px;
  margin: 0;
}
.menu-item.icon-only .menu-icon {
  margin: 0;
  font-size: 18px;
}
.menu-icon {
  flex: 0 0 auto;
  font-size: 17px;
  line-height: 1;
}
.group-icon {
  color: inherit;
}
.menu-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Active state for child menu items */
.menu-group.collapsible + div .menu-item.active,
.menu-group.collapsible + div .menu-item.router-link-exact-active {
  background: linear-gradient(90deg, rgba(25, 179, 107, 0.1) 0%, rgba(25, 179, 107, 0.05) 100%);
  color: #19b36b;
  font-weight: 600;
  border-left-color: #19b36b;
  border-left-width: 3px;
}

@media (max-width: 768px) {
  .side-menu {
    display: none;
  }
}
</style>
