<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../api'

const posts = ref([])
const loading = ref(true)
const error = ref('')

// Compute reading time based on a standard 200 words per minute
function getReadingTime(content) {
  if (!content) return '1 min read'
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return `${minutes} min read`
}

const featuredPost = computed(() => posts.value[0] ?? null)
const remainingPosts = computed(() => posts.value.slice(1))

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
  <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    
    <!-- Ad Slot: Top Banner -->
    <div class="mb-10 w-full bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center p-4 min-h-[100px] text-gray-400 rounded-xl relative overflow-hidden">
      <span class="text-xs uppercase tracking-widest font-semibold mb-1">Advertisement</span>
      <span class="text-sm">Put your Adsterra 728x90 script here</span>
      <!-- <script src="..."></script> -->
    </div>

    <!-- Error State -->
    <div v-if="error" class="mb-8 rounded-lg bg-red-50 p-4 text-red-700">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="animate-pulse space-y-12">
      <!-- Hero Loading -->
      <div class="h-[400px] w-full rounded-2xl bg-gray-200"></div>
      <!-- Grid Loading -->
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="h-64 rounded-xl bg-gray-200"></div>
      </div>
    </div>

    <template v-else-if="posts.length > 0">
      <!-- Featured Post (Hero) -->
      <section class="mb-16">
        <RouterLink :to="`/post/${featuredPost.slug}`" class="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
          <div class="grid md:grid-cols-2">
            <div class="relative h-64 overflow-hidden md:h-full">
              <img :src="featuredPost.cover" :alt="featuredPost.title" class="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            </div>
            <div class="flex flex-col justify-center p-8 sm:p-10">
              <div class="mb-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-brand-600">
                <span>{{ featuredPost.category }}</span>
              </div>
              <h2 class="mb-4 font-display text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
                {{ featuredPost.title }}
              </h2>
              <p class="mb-6 line-clamp-3 text-gray-600 leading-relaxed">
                {{ featuredPost.excerpt }}
              </p>
              <div class="mt-auto flex items-center gap-3 text-sm text-gray-500">
                <span class="font-medium text-gray-900">{{ featuredPost.author }}</span>
                <span>&bull;</span>
                <span>{{ featuredPost.publishedAt }}</span>
                <span>&bull;</span>
                <span>{{ getReadingTime(featuredPost.content) }}</span>
              </div>
            </div>
          </div>
        </RouterLink>
      </section>

      <div class="mb-12 flex items-baseline justify-between border-b border-gray-200 pb-4">
        <h3 class="font-display text-2xl font-bold text-gray-900">Latest Articles</h3>
      </div>

      <!-- Article Grid -->
      <section class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <!-- Post Loop -->
        <template v-for="(post, index) in remainingPosts" :key="post.id">
          <RouterLink
            :to="`/post/${post.slug}`"
            class="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
          >
            <div class="relative h-48 w-full overflow-hidden">
              <img :src="post.cover" :alt="post.title" class="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            </div>
            <div class="flex flex-1 flex-col p-6">
              <div class="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-600">
                {{ post.category }}
              </div>
              <h3 class="font-display text-xl font-bold leading-snug text-gray-900">
                {{ post.title }}
              </h3>
              <p class="mt-3 line-clamp-2 text-sm text-gray-600 leading-relaxed">
                {{ post.excerpt }}
              </p>
              <div class="mt-auto pt-6 flex items-center gap-2 text-xs text-gray-500">
                <span class="font-medium text-gray-900">{{ post.author }}</span>
                <span>&bull;</span>
                <span>{{ post.publishedAt }}</span>
              </div>
            </div>
          </RouterLink>

          <!-- Middle Ad Slot: Appears after every 3rd block in the grid (only visual structural break) -->
          <div v-if="(index + 1) === 3 || (index + 1) === 6" class="col-span-full my-4 flex min-h-[90px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-gray-400">
            <span class="text-xs uppercase tracking-widest font-semibold mb-1">Advertisement</span>
            <span class="text-sm border p-1 border-gray-300 cursor-pointer">Place Ad Script Here</span>
          </div>
        </template>
      </section>

      <!-- Complete Fallback if no posts left to show -->
      <div v-if="remainingPosts.length === 0 && posts.length > 0" class="text-center text-gray-500 py-10">
        You've reached the end!
      </div>
    </template>

    <div v-else class="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
      <h3 class="font-display text-xl font-bold text-gray-900">No articles found</h3>
      <p class="mt-2 text-gray-500">Check back later for new content.</p>
    </div>
  </main>
</template>
