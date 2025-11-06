<template>
  <div class="global-layout">
    <HeaderBar />
    <div class="side-main-wrapper">
      <SideMenu />
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
import Breadcrumb from '@/components/Breadcrumb.vue'
import HeaderBar from '@/layout/components/HeaderBar.vue'
import SideMenu from '@/layout/components/SideMenu.vue'
import AppFooter from '@/layout/components/AppFooter.vue'
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
.footer-icon {
  font-size: $font-size-sm;
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
  gap: 0px; /* space between arrow and text */
  cursor: pointer;
  padding: 12px 20px 12px 8px; /* reduce left padding so arrow sits closer to the left */
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
/* 移除重复的 .user-profile-dropdown 定义，避免覆盖上方布局样式 */
</style> 