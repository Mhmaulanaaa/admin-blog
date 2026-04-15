<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../api'

const posts = ref([])
const loading = ref(true)
const error = ref('')

const featuredPost = computed(() => posts.value[0] ?? null)

async function loadPosts() {
  loading.value = true
  error.value = ''

  try {
    const payload = await api('/posts')
    posts.value = payload.posts
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(loadPosts)
</script>

<template>
  <main>
    <section class="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-16">
      <div class="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-soft">
        <p class="mb-3 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
          Featured Story
        </p>

        <div v-if="loading" class="space-y-4">
          <div class="h-72 animate-pulse rounded-[1.5rem] bg-slate-200"></div>
          <div class="h-8 w-2/3 animate-pulse rounded-full bg-slate-200"></div>
          <div class="h-28 animate-pulse rounded-[1.5rem] bg-slate-100"></div>
        </div>

        <div v-else-if="featuredPost" class="space-y-5">
          <img
            :src="featuredPost.cover"
            :alt="featuredPost.title"
            class="h-72 w-full rounded-[1.5rem] object-cover"
          />
          <div class="space-y-4">
            <div class="flex flex-wrap gap-3 text-sm text-slate-500">
              <span class="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                {{ featuredPost.category }}
              </span>
              <span>{{ featuredPost.publishedAt }}</span>
              <span>{{ featuredPost.author }}</span>
            </div>
            <h1 class="font-display text-4xl font-bold leading-tight text-slate-900">
              {{ featuredPost.title }}
            </h1>
            <p class="max-w-2xl text-lg leading-8 text-slate-600">
              {{ featuredPost.excerpt }}
            </p>
            <RouterLink
              :to="`/post/${featuredPost.slug}`"
              class="inline-flex rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Baca Artikel
            </RouterLink>
          </div>
        </div>

        <div v-else class="rounded-[1.5rem] bg-slate-50 p-8 text-slate-500">
          Belum ada artikel yang dipublikasikan.
        </div>
      </div>

      <div class="space-y-6">
        <div class="rounded-[2rem] border border-brand-100 bg-brand-600 p-8 text-white shadow-soft">
          <p class="text-sm uppercase tracking-[0.22em] text-brand-100">Content Control</p>
          <h2 class="mt-3 font-display text-3xl font-bold leading-tight">
            Post dari dashboard sekarang tersimpan permanen di database.
          </h2>
          <p class="mt-4 text-sm leading-7 text-brand-100">
            Login sebagai admin, tulis artikel baru, dan landing page akan otomatis mengambil data
            terbaru dari backend.
          </p>
          <RouterLink
            to="/admin/login"
            class="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
          >
            Masuk ke Admin
          </RouterLink>
        </div>

        <div class="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-soft">
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Summary</p>
          <div class="mt-5 grid grid-cols-2 gap-4">
            <div class="rounded-3xl bg-slate-50 p-5">
              <p class="text-sm text-slate-500">Total Published</p>
              <p class="mt-2 font-display text-3xl font-bold text-slate-900">{{ posts.length }}</p>
            </div>
            <div class="rounded-3xl bg-slate-50 p-5">
              <p class="text-sm text-slate-500">Latest Update</p>
              <p class="mt-2 text-sm font-semibold text-slate-900">
                {{ featuredPost?.publishedAt ?? '-' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-6 pb-14 lg:px-10 lg:pb-20">
      <div class="mb-8 flex items-end justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Latest Posts</p>
          <h2 class="mt-2 font-display text-3xl font-bold text-slate-900">Artikel terbaru</h2>
        </div>
      </div>

      <div v-if="error" class="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-rose-700">
        {{ error }}
      </div>

      <div v-else class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <RouterLink
          v-for="post in posts"
          :key="post.id"
          :to="`/post/${post.slug}`"
          class="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 shadow-soft transition hover:-translate-y-1"
        >
          <img :src="post.cover" :alt="post.title" class="h-52 w-full object-cover" />
          <div class="space-y-4 p-6">
            <div class="flex items-center justify-between text-sm text-slate-500">
              <span class="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700">
                {{ post.category }}
              </span>
              <span>{{ post.publishedAt }}</span>
            </div>
            <h3 class="font-display text-2xl font-bold leading-snug text-slate-900">
              {{ post.title }}
            </h3>
            <p class="leading-7 text-slate-600">{{ post.excerpt }}</p>
            <p class="text-sm font-semibold text-slate-500">By {{ post.author }}</p>
          </div>
        </RouterLink>
      </div>
    </section>
  </main>
</template>
