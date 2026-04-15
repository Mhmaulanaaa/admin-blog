import { createRouter, createWebHistory } from 'vue-router'
import ArticlePage from './views/ArticlePage.vue'
import DashboardPage from './views/DashboardPage.vue'
import HomePage from './views/HomePage.vue'
import LoginPage from './views/LoginPage.vue'
import { authState } from './stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/post/:slug',
      name: 'article',
      component: ArticlePage,
    },
    {
      path: '/admin/login',
      name: 'login',
      component: LoginPage,
      meta: { guestOnly: true },
    },
    {
      path: '/admin/dashboard',
      name: 'dashboard',
      component: DashboardPage,
      meta: { requiresAuth: true },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !authState.token) {
    return {
      path: '/admin/login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guestOnly && authState.token) {
    return '/admin/dashboard'
  }

  return true
})

export default router
