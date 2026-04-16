<script setup>
import { computed } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { authState, logout } from "./stores/auth";

const route = useRoute();
const router = useRouter();

const isAdminRoute = computed(() => route.path.startsWith("/admin"));

const handleLogout = async () => {
  logout();
  await router.push("/admin/login");
};
</script>

<template>
  <div class="flex min-h-screen flex-col font-body">
    <header
      class="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md"
    >
      <div
        class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <!-- Logo -->
        <RouterLink to="/" class="flex flex-col">
          <span
            class="font-display text-xl font-bold tracking-tight text-gray-900"
            >EasyTrends</span
          >
        </RouterLink>

        <!-- Nav -->
        <nav class="flex items-center gap-4">
          <RouterLink
            v-if="!isAdminRoute"
            to="/"
            class="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Home
          </RouterLink>

          <template v-if="authState.token">
            <RouterLink
              to="/admin/dashboard"
              class="text-sm font-medium text-brand-600 transition hover:text-brand-700"
            >
              Dashboard
            </RouterLink>
            <button
              class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              @click="handleLogout"
            >
              Logout
            </button>
          </template>
          <template v-else>
            <RouterLink
              to="/admin/login"
              class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Sign In
            </RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer
      class="mt-auto border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500"
    >
      <div class="mx-auto max-w-6xl px-4">
        &copy; {{ new Date().getFullYear() }} StoryFlow. All rights reserved.
      </div>
    </footer>
  </div>
</template>
