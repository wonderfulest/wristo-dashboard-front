import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Marketing Email module (moved under /marketing)
    {
      path: '/marketing/email-templates',
      name: 'EmailTemplates',
      component: () => import('@/views/marketing/EmailTemplates.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/marketing/email-templates/:id/edit',
      name: 'EmailTemplateEdit',
      component: () => import('@/views/marketing/EmailTemplateEdit.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/marketing/email-records',
      name: 'MerchantEmailRecords',
      component: () => import('@/views/marketing/EmailRecords.vue'),
      meta: { requiresAuth: true }
    },
    // Backward-compatible redirects from old /email paths
    { path: '/email/email-templates', redirect: '/marketing/email-templates' },
    { path: '/email/email-templates/:id/edit', redirect: to => ({ path: `/marketing/email-templates/${to.params.id}/edit` }) },
    { path: '/email/email-records', redirect: '/marketing/email-records' },
    { path: '/email-templates', redirect: '/marketing/email-templates' },
    { path: '/email-templates/:id/edit', redirect: to => ({ path: `/marketing/email-templates/${to.params.id}/edit` }) },
    { path: '/email-records', redirect: '/marketing/email-records' },
    {
      path: '/db-backups',
      name: 'DbBackups',
      component: () => import('@/views/DbBackups.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/system-config',
      name: 'SystemConfig',
      component: () => import('@/views/SystemConfig.vue'),
      meta: { requiresAuth: true }
    },
    // Orders module (new nested paths)
    {
      path: '/orders/history',
      name: 'OrdersHistory',
      component: () => import('@/views/orders/History.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/orders/discounts',
      name: 'OrdersDiscounts',
      component: () => import('@/views/orders/Discounts.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/orders/subscription-plans',
      name: 'OrdersSubscriptionPlans',
      component: () => import('@/views/orders/SubscriptionPlans.vue'),
      meta: { requiresAuth: true }
    },
    // Backward-compatible redirects
    {
      path: '/subscription-plans',
      redirect: '/orders/subscription-plans'
    },
    {
      path: '/user-management',
      name: 'UserManagement',
      component: () => import('@/views/UserManagement.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/role-management',
      name: 'RoleManagement',
      component: () => import('@/views/RoleManagement.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dict',
      name: 'Dict',
      component: () => import('@/views/Dict.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/design-review',
      name: 'DesignReview',
      component: () => import('@/views/DesignReview.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products',
      name: 'Products',
      component: () => import('@/views/Products.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/merchant',
      name: 'Merchant',
      component: () => import('@/views/Merchant.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/merchant/tools',
      name: 'MerchantTools',
      component: () => import('@/views/MerchantTools.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/merchant/payouts',
      name: 'MerchantPayouts',
      component: () => import('@/views/MerchantPayouts.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/orders/refund',
      name: 'OrdersRefund',
      component: () => import('@/views/orders/OrdersRefund.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/fonts',
      name: 'Fonts',
      component: () => import('@/views/Fonts.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/marketing/campaigns',
      name: 'Campaigns',
      component: () => import('@/views/marketing/Campaigns.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/marketing/customers',
      name: 'Customers',
      component: () => import('@/views/marketing/Customers.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/marketing/tags',
      name: 'Tags',
      component: () => import('@/views/marketing/Tags.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/marketing/segments',
      name: 'Segments',
      component: () => import('@/views/marketing/Segments.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/marketing/user-profiles',
      name: 'UserProfiles',
      component: () => import('@/views/marketing/UserProfiles.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/marketing',
      redirect: '/marketing/campaigns'
    },
    {
      path: '/images',
      name: 'Images',
      component: () => import('@/views/ImageAssets.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/data-type-options',
      name: 'DataTypeOptions',
      component: () => import('@/views/DataTypeOptions.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/Profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/categories',
      name: 'Categories',
      component: () => import('@/views/Categories.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/packaging-logs',
      name: 'PackagingLogs',
      component: () => import('@/views/PackagingLogs.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/app-daily/config',
      name: 'AppDailyConfig',
      component: () => import('@/views/AppDailyConfig.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/app-daily/config/edit/:appId',
      name: 'AppDailyConfigEdit',
      component: () => import('@/views/AppDailyConfigEdit.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/app-daily/picks/:appId',
      name: 'AppDailyPicks',
      component: () => import('@/views/AppDailyPicks.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/auth/callback',
      name: 'AuthCallback',
      component: () => import('@/views/AuthCallback.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
   
  ]
})

// 路由守卫
router.beforeEach((to, _, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const ssoBaseUrl = import.meta.env.VITE_SSO_LOGIN_URL
  const redirectUri = import.meta.env.VITE_SSO_REDIRECT_URI
  const ssoLoginUrl = `${ssoBaseUrl}?client=dashboard&redirect_uri=${encodeURIComponent(redirectUri)}`

  console.log('beforeEach userInfo', userStore.userInfo)
  if (requiresAuth && !userStore.userInfo) {
    window.location.href = ssoLoginUrl
    return
  } else {
    next()
  }
})

export default router
