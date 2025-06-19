<template>
  <div class="global-layout">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-inner">
        <div class="logo">
          <span class="logo-icon">W</span>
          <span class="logo-text">pay</span>
        </div>
        <nav class="nav-list">
          <router-link to="/dashboard" class="nav-item" active-class="active">官网运营</router-link>
          <router-link to="/orders" class="nav-item" active-class="active">订单管理</router-link>
          <router-link to="/user-management" class="nav-item" active-class="active">用户管理</router-link>
          <router-link to="/marketing" class="nav-item" active-class="active">营销工具</router-link>
          <router-link to="/reports" class="nav-item" active-class="active">报表中心</router-link>
        </nav>
        <div class="header-right">
          <div class="user-profile-dropdown">
            <div class="user-profile-name" @click="toggleDropdown">
              {{ userStore.userInfo?.username }}
              <span class="dropdown-arrow">▼</span>
            </div>
            <div class="dropdown-content" v-if="isDropdownOpen">
              <a href="/account/profile">编辑资料</a>
              <a href="/account/password">修改密码</a>
              <a href="#" @click.prevent="handleLogout">退出登录</a>
            </div>
          </div>
        </div>
      </div>
    </header>
    <div class="side-main-wrapper">
      <!-- Side Menu -->
      <aside class="side-menu">
        <nav class="menu-list">
          <router-link to="/dashboard" class="menu-item" active-class="active">仪表盘</router-link>
          <router-link to="/user-management" class="menu-item" active-class="active">用户管理</router-link>
          <router-link to="/role-management" class="menu-item" active-class="active">角色管理</router-link>
          <router-link to="/products" class="menu-item" active-class="active">产品管理</router-link>
          <router-link to="/categories" class="menu-item" active-class="active">分类管理</router-link>
          <router-link to="/history" class="menu-item" active-class="active">历史记录</router-link>
          <router-link to="/discounts" class="menu-item" active-class="active">优惠管理</router-link>
          <router-link to="/profile" class="menu-item" active-class="active">个人资料</router-link>
        </nav>
      </aside>
      <!-- Main Content -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-left">
          <span class="footer-icon">🐦</span>
          <span>© Wristo 2025</span>
        </div>
        <div class="footer-links">
          <a href="#">Terms of Use</a>
          <a href="#">Privacy Policy</a>
          <a href="mailto:support@wristo.io">support@wristo.io</a>
        </div>
        <div class="footer-right">
          <span>Wristo</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { useRouter } from 'vue-router'
import { computed, ref } from 'vue'
const router = useRouter()
const userStore = useUserStore()
const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}

const hasMerchantRole = computed(() => {
  const roles: any[] = (userStore.userInfo && Array.isArray((userStore.userInfo as any).roles)) ? (userStore.userInfo as any).roles : []
  return roles.some((role: any) => role.roleCode === 'ROLE_MERCHANT')
})

// 下拉菜单控制
const isDropdownOpen = ref(false)
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

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
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 32px 0 0 0;
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
  top: 60px;
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
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 32px;
}
.user-profile-name {
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 56px;
  font-size: 1rem;
}
.dropdown-arrow {
  margin-left: 6px;
  font-size: 0.9em;
  display: flex;
  align-items: center;
}
.side-main-wrapper {
  display: flex;
  min-height: 100vh;
}
.side-menu {
  width: 220px;
  background: #fff;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 100vh;
}
.menu-list {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.menu-item {
  padding: 14px 32px;
  color: #222;
  text-decoration: none;
  font-size: 1.1rem;
  transition: background 0.2s, color 0.2s;
}
.menu-item.active, .menu-item.router-link-exact-active {
  background: #f5f5f5;
  color: #19b36b;
  font-weight: bold;
}
.user-profile-dropdown {
  margin-top: auto;
  width: 100%;
  padding: 0 32px 32px 32px;
}
</style> 