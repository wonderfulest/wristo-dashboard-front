<template>
  <aside class="side-menu">
    <nav class="menu-list">
      <template v-for="item in activeChildren" :key="item.key">
        <template v-if="item.children && item.children.length">
          <div class="menu-group collapsible" @click="toggleGroup(item.key)">
            <span class="arrow" :class="{ open: isGroupOpen(item.key) }">▸</span>
            <span>{{ item.title }}</span>
          </div>
          <div v-show="isGroupOpen(item.key)">
            <router-link
              v-for="sub in item.children"
              :key="sub.key"
              :to="sub.path as string"
              class="menu-item"
              active-class="active"
            >
              {{ sub.title }}
            </router-link>
          </div>
        </template>
        <router-link
          v-else
          :to="item.path as string"
          class="menu-item"
          active-class="active"
        >
          {{ item.title }}
        </router-link>
      </template>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { topMenus } from '@/config/menu'

// 动态菜单：根据当前路由选择顶部分组与侧边二级菜单
const route = useRoute()
const isTopActive = (group: any) => group.basePaths?.some((p: string) => route.path.startsWith(p))
const activeTop = computed(() => topMenus.find((g) => isTopActive(g)) || topMenus[0])
const activeChildren = computed(() => activeTop.value?.children || [])

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
  width: 160px;
  background: #fff;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 100%;
  box-shadow: 2px 0 8px rgba(0,0,0,0.06);
}
.menu-list {
  display: flex;
  flex-direction: column;
  width: 160px;
  padding: 16px 0;
  text-align: left;
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
  gap: 0px;
  cursor: pointer;
  padding: 12px 20px 12px 8px;
  margin: 4px 0;
  border-radius: 6px;
  transition: all 0.2s ease;
  background: transparent;
  width: 100%;
  justify-content: flex-start;
  text-align: left;
}
.menu-group.collapsible:hover {
  background: #f5f7fa;
  color: #409eff;
}
.menu-group .arrow {
  display: inline-block;
  transition: transform 0.2s ease;
  color: #909399;
  font-size: 12px;
  width: 12px;
  text-align: center;
}
.menu-group .arrow.open {
  transform: rotate(90deg);
  color: #409eff;
}
.menu-item {
  padding: 10px 20px;
  color: #606266;
  text-decoration: none;
  font-size: 13px;
  transition: background 0.2s, color 0.2s;
  border-radius: 0 20px 20px 0;
  margin: 2px 0;
  margin-right: 12px;
  display: block;
  text-align: left;
}
/* Child menu items under groups */
.menu-group.collapsible + div .menu-item {
  /* Align child text with parent text start (left padding 8 + arrow 12 + gap 8 = 28px) */
  padding-left: 28px;
  margin-left: 0;
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
/* Active state for child menu items */
.menu-group.collapsible + div .menu-item.active,
.menu-group.collapsible + div .menu-item.router-link-exact-active {
  background: linear-gradient(90deg, rgba(25, 179, 107, 0.1) 0%, rgba(25, 179, 107, 0.05) 100%);
  color: #19b36b;
  font-weight: 600;
  border-left-color: #19b36b;
  border-left-width: 3px;
}
</style>
