<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '../api'

const route = useRoute()
const post = ref(null)
const latestPosts = ref([])
const loading = ref(true)
const error = ref('')

const paragraphs = computed(() => {
  if (!post.value?.content) {
    return []
  }

  return post.value.content.split('\n').filter(Boolean)
})

async function loadArticle() {
  loading.value = true
  error.value = ''

  try {
    const [articlePayload, postsPayload] = await Promise.all([
      api(`/posts/${route.params.slug}`),
      api('/posts'),
    ])
    post.value = articlePayload.post
    latestPosts.value = postsPayload.posts.filter((item) => item.slug !== route.params.slug).slice(0, 3)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

watch(() => route.params.slug, loadArticle)
onMounted(loadArticle)
</script>

<template>
  <main class="mx-auto max-w-5xl px-6 py-12 lg:px-10 lg:py-16">
    <div v-if="loading" class="space-y-6">
      <div class="h-12 w-1/2 animate-pulse rounded-full bg-slate-200"></div>
      <div class="h-96 animate-pulse rounded-[2rem] bg-slate-200"></div>
      <div class="h-48 animate-pulse rounded-[2rem] bg-slate-100"></div>
    </div>

    <div v-else-if="error" class="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-rose-700">
      {{ error }}
    </div>

    <article v-else-if="post" class="space-y-10">
      <div class="space-y-5">
        <RouterLink to="/" class="inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800">
          ← Kembali ke landing page
        </RouterLink>
        <div class="flex flex-wrap gap-3 text-sm text-slate-500">
          <span class="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700">
            {{ post.category }}
          </span>
          <span>{{ post.publishedAt }}</span>
          <span>{{ post.author }}</span>
        </div>
        <h1 class="max-w-4xl font-display text-4xl font-bold leading-tight text-slate-900 lg:text-6xl">
          {{ post.title }}
        </h1>
        <p class="max-w-3xl text-lg leading-8 text-slate-600">{{ post.excerpt }}</p>
      </div>

      <img :src="post.cover" :alt="post.title" class="h-[28rem] w-full rounded-[2rem] object-cover shadow-soft" />

      <section class="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div class="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-soft">
          <div class="story-copy">
            <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
          </div>
        </div>

        <aside class="space-y-5">
          <div class="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Written By</p>
            <p class="mt-3 font-display text-2xl font-bold text-slate-900">{{ post.author }}</p>
            <p class="mt-3 text-sm leading-7 text-slate-600">
              Artikel ini diterbitkan melalui dashboard manager StoryFlow dan tersimpan di database.
            </p>
          </div>

          <div class="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Baca Juga</p>
            <div class="mt-5 space-y-4">
              <RouterLink
                v-for="item in latestPosts"
                :key="item.id"
                :to="`/post/${item.slug}`"
                class="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-slate-100"
              >
                <p class="font-semibold text-slate-900">{{ item.title }}</p>
                <p class="mt-2 text-sm text-slate-500">{{ item.publishedAt }}</p>
              </RouterLink>
            </div>
          </div>
        </aside>
      </section>
    </article>
  </main>
</template>
