import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Blog module
    {
      path: '/blog/posts',
      name: 'BlogPosts',
      component: () => import('@/views/blog/Posts.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/blog/posts/:id/edit',
      name: 'BlogPostEdit',
      component: () => import('@/views/blog/PostEdit.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/blog/categories',
      name: 'BlogCategories',
      component: () => import('@/views/blog/Categories.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/blog/tags',
      name: 'BlogTags',
      component: () => import('@/views/blog/Tags.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/blog/toc',
      name: 'BlogToc',
      component: () => import('@/views/blog/TocItems.vue'),
      meta: { requiresAuth: true }
    },
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
      path: '/email-records',
      name: 'EmailRecords',
      component: () => import('@/views/dashboard/EmailRecords.vue'),
      meta: { requiresAuth: true }
    },
    // Ops module (new nested paths)
    {
      path: '/ops/db-backups',
      name: 'DbBackups',
      component: () => import('@/views/ops/DbBackups.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ops/system-config',
      name: 'SystemConfig',
      component: () => import('@/views/ops/SystemConfig.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ops/s3-ops',
      name: 'S3Ops',
      component: () => import('@/views/ops/S3Ops.vue'),
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
      component: () => import('@/views/dashboard/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/packaging/design-review',
      name: 'DesignReview',
      component: () => import('@/views/dashboard/packaging/DesignReview.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/packaging/packaging-logs',
      name: 'PackagingLogs',
      component: () => import('@/views/dashboard/packaging/PackagingLogs.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products',
      name: 'Products',
      component: () => import('@/views/products/Products.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products/garmin-devices',
      name: 'GarminDevices',
      component: () => import('@/views/products/GarminDevices.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products/garmin-devices/:deviceId',
      name: 'GarminDeviceDetail',
      component: () => import('@/views/products/GarminDeviceDetail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products/device-un-support',
      name: 'ProductsDeviceUnSupport',
      component: () => import('@/views/products/DeviceUnSupport.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/merchant',
      name: 'Merchant',
      component: () => import('@/views/merchant/Merchant.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/merchant/tools',
      name: 'MerchantTools',
      component: () => import('@/views/merchant/MerchantTools.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/merchant/payouts',
      name: 'MerchantPayouts',
      component: () => import('@/views/merchant/MerchantPayouts.vue'),
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
      component: () => import('@/views/dashboard/Fonts.vue'),
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
      component: () => import('@/views/dashboard/ImageAssets.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/icon-library',
      name: 'IconLibrary',
      component: () => import('@/views/icons/IconLibrary.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/icon-assets',
      name: 'IconAssets',
      component: () => import('@/views/icons/IconAssets.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/icon-glyphs',
      name: 'IconGlyphs',
      component: () => import('@/views/icons/IconGlyphs.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/icon-glyphs/:glyphId/assets',
      name: 'IconGlyphAssets',
      component: () => import('@/views/icons/IconGlyphAssets.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/data-type-options',
      name: 'DataTypeOptions',
      component: () => import('@/views/dashboard/data-options/DataTypeOptionsPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/color-type-options',
      name: 'ColorTypeOptions',
      component: () => import('@/views/dashboard/system/ColorTypeOptions.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tickets',
      name: 'Tickets',
      component: () => import('@/views/dashboard/Tickets.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('@/views/Profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/system/template-variables',
      name: 'TemplateVariables',
      component: () => import('@/views/dashboard/system/TemplateVariables.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products/categories',
      name: 'Categories',
      component: () => import('@/views/products/Categories.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products/app-daily/config',
      name: 'AppDailyConfig',
      component: () => import('@/views/products/AppDailyConfig.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products/app-daily/config/edit/:appId',
      name: 'AppDailyConfigEdit',
      component: () => import('@/views/products/AppDailyConfigEdit.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products/app-daily/picks/:appId',
      name: 'AppDailyPicks',
      component: () => import('@/views/products/AppDailyPicks.vue'),
      meta: { requiresAuth: true }
    },
    // Redirects from old app-daily paths
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
