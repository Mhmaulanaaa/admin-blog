<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { login } from "../stores/auth";

const router = useRouter();
const route = useRoute();

const form = reactive({
  email: "",
  password: "",
});

const loading = ref(false);
const error = ref("");

async function submit() {
  loading.value = true;
  error.value = "";

  try {
    await login(form);
    await router.push(route.query.redirect || "/admin/dashboard");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main
    class="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8"
  >
    <div
      class="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-sm border border-gray-200 sm:p-10"
    >
      <div class="text-center">
        <h2
          class="font-display text-3xl font-bold tracking-tight text-gray-900"
        >
          Welcome Back
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Sign in to access your EasyTrends dashboard
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="submit">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Email address</label
            >
            <input
              v-model="form.email"
              type="email"
              required
              class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Password</label
            >
            <input
              v-model="form.password"
              type="password"
              required
              class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div v-if="error" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="flex w-full justify-center rounded-lg border border-transparent bg-brand-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 transition"
          >
            {{ loading ? "Signing in..." : "Sign In" }}
          </button>
        </div>
      </form>
    </div>
  </main>
</template>
