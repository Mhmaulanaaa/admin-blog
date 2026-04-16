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
    class="mx-auto grid min-h-[calc(100vh-89px)] max-w-7xl items-center gap-8 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:py-16"
  >
    <section
      class="rounded-[2rem] border border-brand-100 bg-brand-600 p-8 text-white shadow-soft lg:p-10"
    >
      <p class="text-sm uppercase tracking-[0.22em] text-brand-100">
        Admin Access
      </p>
      <h1 class="mt-3 font-display text-4xl font-bold leading-tight">
        Login untuk mengelola posting dan menyimpannya permanen.
      </h1>
      <p class="mt-5 max-w-xl leading-8 text-brand-100">
        Dashboard admin sekarang menggunakan backend dan database SQLite.
        Setelah login, Anda bisa membuat, mengedit, dan menghapus post yang
        langsung tersimpan di server.
      </p>

      <div
        class="mt-8 rounded-[1.5rem] bg-white/10 p-5 text-sm leading-7 text-brand-50"
      >
        <!-- <p class="font-semibold text-white">Akun default untuk percobaan:</p>
        <p>Email: <strong>admin@storyflow.local</strong></p>
        <p>Password: <strong>Admin123!</strong></p> -->
      </div>
    </section>

    <section
      class="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-soft lg:p-10"
    >
      <p
        class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400"
      >
        Login Admin
      </p>
      <h2 class="mt-2 font-display text-3xl font-bold text-slate-900">
        Masuk ke dashboard
      </h2>

      <form class="mt-8 space-y-5" @submit.prevent="submit">
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700"
            >Email</label
          >
          <input
            v-model="form.email"
            placeholder="Masukkan Email"
            type="email"
            required
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700"
            >Password</label
          >
          <input
            placeholder="Masukkan Password"
            v-model="form.password"
            type="password"
            required
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white"
          />
        </div>

        <div
          v-if="error"
          class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {{ loading ? "Memproses..." : "Login Sekarang" }}
        </button>
      </form>
    </section>
  </main>
</template>
