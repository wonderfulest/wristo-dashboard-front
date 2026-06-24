<template>
  <div class="global-layout">
    <HeaderBar @open-mobile-menu="mobileMenuVisible = true" />
    <div class="side-main-wrapper">
      <SideMenu :collapsed="isSideMenuCollapsed" @toggle-collapse="toggleSideMenu" />
      <!-- Main Content -->
      <main class="main-content">
        <Breadcrumb />
        <div class="content-wrapper">
          <div class="page-content">
            <router-view />
          </div>
        </div>
      </main>
    </div>
    <el-drawer
      v-model="mobileMenuVisible"
      title="菜单"
      direction="ltr"
      size="82%"
      custom-class="mobile-menu-drawer"
    >
      <nav class="mobile-menu-tree" aria-label="手机菜单">
        <section v-for="group in topMenus" :key="group.key" class="mobile-menu-group">
          <button
            type="button"
            class="mobile-menu-group-title"
            :class="{ active: isTopActive(group) }"
            :aria-expanded="isMobileGroupOpen(group.key)"
            @click="toggleMobileGroup(group.key)"
          >
            <span>{{ group.title }}</span>
            <el-icon class="mobile-menu-arrow" :class="{ open: isMobileGroupOpen(group.key) }">
              <ArrowRight />
            </el-icon>
          </button>
          <div v-if="isMobileGroupOpen(group.key)" class="mobile-menu-children">
            <template v-for="item in group.children" :key="item.key">
              <div v-if="item.children?.length" class="mobile-menu-subgroup">
                <button
                  type="button"
                  class="mobile-menu-subtitle"
                  :class="{ active: isMobileSubmenuActive(item) }"
                  :aria-expanded="isMobileSubmenuOpen(item.key)"
                  @click="toggleMobileSubmenu(item.key)"
                >
                  <span>{{ item.title }}</span>
                  <el-icon class="mobile-menu-arrow" :class="{ open: isMobileSubmenuOpen(item.key) }">
                    <ArrowRight />
                  </el-icon>
                </button>
                <template v-if="isMobileSubmenuOpen(item.key)">
                  <router-link
                    v-for="sub in item.children"
                    :key="sub.key"
                    :to="sub.path as string"
                    class="mobile-menu-link"
                    active-class="active"
                    @click="closeMobileMenu"
                  >
                    {{ sub.title }}
                  </router-link>
                </template>
              </div>
              <router-link
                v-else-if="item.path"
                :to="item.path"
                class="mobile-menu-link"
                active-class="active"
                @click="closeMobileMenu"
              >
                {{ item.title }}
              </router-link>
            </template>
          </div>
        </section>
      </nav>
    </el-drawer>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Breadcrumb from '@/components/Breadcrumb.vue'
import HeaderBar from '@/layout/components/HeaderBar.vue'
import SideMenu from '@/layout/components/SideMenu.vue'
import AppFooter from '@/layout/components/AppFooter.vue'
import { hasMatchingChildPath, isTopMenuActive, topMenus, type SubMenuItem, type TopMenuGroup } from '@/config/menu'
import { ArrowRight } from '@element-plus/icons-vue'

const isSideMenuCollapsed = ref(false)
const mobileMenuVisible = ref(false)
const openMobileGroups = ref<Set<string>>(new Set())
const openMobileSubmenus = ref<Set<string>>(new Set())
const route = useRoute()
const toggleSideMenu = () => {
  isSideMenuCollapsed.value = !isSideMenuCollapsed.value
}
const toggleSetValue = (setRef: typeof openMobileGroups, key: string) => {
  const next = new Set(setRef.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  setRef.value = next
}
const closeMobileMenu = () => {
  mobileMenuVisible.value = false
}
const toggleMobileGroup = (key: string) => toggleSetValue(openMobileGroups, key)
const toggleMobileSubmenu = (key: string) => toggleSetValue(openMobileSubmenus, key)
const isMobileGroupOpen = (key: string) => openMobileGroups.value.has(key)
const isMobileSubmenuOpen = (key: string) => openMobileSubmenus.value.has(key)
const isTopActive = (group: TopMenuGroup) => isTopMenuActive(group, route.path)
const isMobileSubmenuActive = (item: SubMenuItem) => item.children ? hasMatchingChildPath(item.children, route.path) : false

const syncActiveMobileMenu = () => {
  const activeGroup = topMenus.find((group) => isTopMenuActive(group, route.path))
  openMobileGroups.value = activeGroup ? new Set([activeGroup.key]) : new Set()
  const activeSubmenu = activeGroup?.children.find((item) => item.children && hasMatchingChildPath(item.children, route.path))
  openMobileSubmenus.value = activeSubmenu ? new Set([activeSubmenu.key]) : new Set()
}

watch(mobileMenuVisible, (visible) => {
  if (visible) syncActiveMobileMenu()
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.global-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $color-bg;
}
.header {
  background: $color-bg;
  color: $color-link;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
  position: relative; /* 为居中用户名提供定位上下文 */
}
.logo {
  display: flex;
  align-items: center;
  font-size: 2.2rem;
  font-weight: bold;
}
.logo-center {
  justify-content: center;
  width: 100%;
  margin: 12px 0 12px 0;
}
.logo-icon {
  color: $color-success;
  font-size: 2.2rem;
  font-weight: 700;
  margin-right: 6px;
}
.logo-text {
  color: $color-link;
  font-weight: 700;
  font-size: 2.2rem;
}
.nav-list {
  display: flex;
  gap: 32px;
  align-items: center;
  margin-left: 48px;
}
.nav-item {
  color: $color-link;
  font-weight: 500;
  text-decoration: none;
  font-size: 1.1rem;
  transition: color 0.2s;
}
.nav-item.active, .nav-item:hover {
  color: $color-success;
}
.header-right {
  display: flex;
  gap: 24px;
  align-items: center;
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #fff;
  border-radius: 0 0 8px 8px;
  // margin: 0 16px 16px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.footer {
  background: $color-footer-bg;
  padding: 8px 0;
  width: 100%;
  position: sticky;
  bottom: 0;
  left: 0;
  margin-top: auto;
  font-size: $font-size-xs;
}
.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  font-size: $font-size-sm;
  color: $color-footer-text;
}
.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.footer-links {
  display: flex;
  gap: 18px;
}
.footer-links a {
  color: $color-footer-text;
  text-decoration: none;
  transition: color 0.2s;
}
.footer-links a:hover {
  color: $color-success;
}
.footer-right {
  font-weight: bold;
  color: $color-footer-text;
}
.dropdown-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  border-radius: 8px;
  padding: 10px 0;
  position: absolute;
  right: 0;
  top: 64px;
  min-width: 160px;
  z-index: 100;
}
.dropdown-content a {
  width: 100%;
  padding: 10px 24px;
  color: #222;
  text-decoration: none;
  font-size: 1rem;
  transition: background 0.2s, color 0.2s;
  box-sizing: border-box;
  display: block;
}
.dropdown-content a:hover {
  background: #f5f5f5;
  color: #19b36b;
}
.user-profile-dropdown {
  position: relative;
  height: 64px; /* 与 header 高度一致，保证垂直居中 */
  display: flex;
  align-items: center;
  padding: 0 16px;
  /* 合并下方重复定义的附加属性，避免覆盖布局 */
  margin-top: auto;
  width: 100%;
}
.user-profile-name {
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 64px; /* 与 header 同高，保持垂直居中 */
  line-height: normal; /* 由 flex 控制垂直居中，避免基线偏移 */
  gap: 6px;
  font-size: 1rem;
}
.dropdown-arrow {
  margin-left: 6px;
  font-size: 0.8em;
  display: flex;
  align-items: center;
  line-height: 1; /* 防止图标产生额外行高 */
}
.side-main-wrapper {
  display: flex;
  flex: 1;
  min-height: calc(100vh - 64px);
}
/* 移除重复的 .user-profile-dropdown 定义，避免覆盖上方布局样式 */

@media (max-width: 1024px) {
  .side-main-wrapper {
    flex-direction: column;
    min-height: auto;
  }

  .main-content {
    min-height: auto;
  }

  .content-wrapper {
    height: auto;
  }

  .page-content {
    border-radius: 0;
    box-shadow: none;
  }
}

@media (max-width: 768px) {
  .global-layout {
    overflow-x: hidden;
  }

  .main-content {
    overflow: visible;
  }

  .page-content {
    padding: 12px;
    margin: 0;
  }
}

.mobile-menu-tree {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.mobile-menu-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-menu-group-title {
  display: flex;
  min-height: 42px;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  color: #303133;
  font-size: 15px;
  font-weight: 700;
  background: #f7f8fa;
  cursor: pointer;
  font-family: inherit;
}

.mobile-menu-group-title.active {
  color: #19b36b;
  background: #e8f5e8;
}

.mobile-menu-group-title:focus-visible,
.mobile-menu-subtitle:focus-visible {
  outline: 2px solid rgba(25, 179, 107, 0.35);
  outline-offset: 2px;
}

.mobile-menu-children {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mobile-menu-subgroup {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-menu-subtitle {
  display: flex;
  min-height: 36px;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  color: #909399;
  font-size: 12px;
  font-weight: 600;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
}

.mobile-menu-subtitle.active {
  color: #19b36b;
  background: rgba(25, 179, 107, 0.06);
}

.mobile-menu-link {
  display: flex;
  min-height: 40px;
  align-items: center;
  padding: 0 16px;
  border-radius: 8px;
  color: #606266;
  font-size: 14px;
}

.mobile-menu-link.active,
.mobile-menu-link.router-link-exact-active {
  color: #19b36b;
  background: rgba(25, 179, 107, 0.08);
  font-weight: 600;
}

.mobile-menu-arrow {
  flex: 0 0 auto;
  font-size: 14px;
  transition: transform 0.2s ease;
}

.mobile-menu-arrow.open {
  transform: rotate(90deg);
}

:deep(.mobile-menu-drawer .el-drawer__header) {
  margin-bottom: 8px;
}
</style>
