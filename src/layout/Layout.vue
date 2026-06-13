<template>
  <div class="global-layout">
    <HeaderBar />
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
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Breadcrumb from '@/components/Breadcrumb.vue'
import HeaderBar from '@/layout/components/HeaderBar.vue'
import SideMenu from '@/layout/components/SideMenu.vue'
import AppFooter from '@/layout/components/AppFooter.vue'

const isSideMenuCollapsed = ref(false)
const toggleSideMenu = () => {
  isSideMenuCollapsed.value = !isSideMenuCollapsed.value
}
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
  }
}
</style>
