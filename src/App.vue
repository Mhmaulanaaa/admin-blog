<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { authState, logout } from './stores/auth'

const route = useRoute()
const router = useRouter()

const isAdminRoute = computed(() => route.path.startsWith('/admin'))

const handleLogout = async () => {
  logout()
  await router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-glow text-ink">
    <header class="sticky top-0 z-30 border-b border-white/70 bg-sand/80 backdrop-blur">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <RouterLink to="/" class="block">
          <p class="font-display text-2xl font-bold tracking-tight text-brand-700">StoryFlow</p>
          <p class="text-sm text-slate-500">Blog manager dengan admin dashboard</p>
        </RouterLink>

        <nav class="flex flex-wrap items-center gap-3">
          <RouterLink
            to="/"
            class="rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="
              !isAdminRoute
                ? 'bg-brand-600 text-white shadow-soft'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            "
          >
            Landing Page
          </RouterLink>

          <RouterLink
            v-if="authState.token"
            to="/admin/dashboard"
            class="rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="
              isAdminRoute
                ? 'bg-ink text-white shadow-soft'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            "
          >
            Dashboard
          </RouterLink>

          <RouterLink
            v-else
            to="/admin/login"
            class="rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="
              isAdminRoute
                ? 'bg-ink text-white shadow-soft'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            "
          >
            Login Admin
          </RouterLink>

          <button
            v-if="authState.token"
            class="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            @click="handleLogout"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>

    <RouterView />
  </div>
</template>
