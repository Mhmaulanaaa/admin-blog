<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { api } from "../api";

const route = useRoute();
const post = ref(null);
const latestPosts = ref([]);
const loading = ref(true);
const error = ref("");

// Basic markdown/HTML split to render paragraphs cleanly
const paragraphs = computed(() => {
  if (!post.value?.content) {
    return [];
  }
  return post.value.content.split("\n").filter(Boolean);
});

function getReadingTime(content) {
  if (!content) return "1 min read";
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

async function loadArticle() {
  loading.value = true;
  error.value = "";

  try {
    const [articlePayload, postsPayload] = await Promise.all([
      api(`/posts/${route.params.slug}`),
      api("/posts"),
    ]);
    post.value = articlePayload.post;
    // Ambil 3 related posts (kecuali yang sedang dibaca)
    latestPosts.value = postsPayload.posts
      .filter((item) => item.slug !== route.params.slug)
      .slice(0, 3);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.slug, loadArticle);
onMounted(loadArticle);
</script>

<template>
  <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
    <div v-if="loading" class="animate-pulse space-y-8">
      <div class="h-12 w-3/4 rounded-xl bg-gray-200"></div>
      <div class="h-[400px] w-full rounded-2xl bg-gray-200"></div>
      <div class="h-64 w-full rounded-xl bg-gray-100"></div>
    </div>

    <div
      v-else-if="error"
      class="rounded-lg bg-red-50 p-6 text-red-700 text-center"
    >
      <h2 class="text-xl font-bold mb-2">Oops!</h2>
      <p>{{ error }}</p>
      <RouterLink
        to="/"
        class="mt-4 inline-block font-semibold underline text-red-800"
        >Return to Home</RouterLink
      >
    </div>

    <article v-else-if="post">
      <!-- Article Header -->
      <header class="mb-10 text-center">
        <div
          class="mb-4 text-sm font-semibold uppercase tracking-widest text-brand-600"
        >
          {{ post.category }}
        </div>
        <h1
          class="mb-6 font-display text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl"
        >
          {{ post.title }}
        </h1>
        <div
          class="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500"
        >
          <span class="font-medium text-gray-900">{{ post.author }}</span>
          <span>&bull;</span>
          <span>{{ post.publishedAt }}</span>
          <span>&bull;</span>
          <span>{{ getReadingTime(post.content) }}</span>
        </div>

        <!-- Share Buttons (Mockup) -->
        <div class="mt-8 flex justify-center gap-4">
          <button
            class="rounded-full bg-[#1DA1F2] px-4 py-2 text-xs font-semibold text-white transition hover:bg-opacity-90"
          >
            Share on Twitter
          </button>
          <button
            class="rounded-full bg-[#1877F2] px-4 py-2 text-xs font-semibold text-white transition hover:bg-opacity-90"
          >
            Share on Facebook
          </button>
        </div>
      </header>

      <!-- Featured Image -->
      <div class="mb-12">
        <img
          :src="post.cover"
          :alt="post.title"
          class="max-h-[500px] w-full rounded-2xl object-cover shadow-sm"
        />
      </div>

      <!-- Ad Slot: Top Banner Content -->
      <!-- <div class="mb-10 w-full bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center p-4 min-h-[90px] text-gray-400 rounded-xl relative overflow-hidden">
         <span class="text-xs uppercase tracking-widest font-semibold mb-1">Advertisement</span>
      </div> -->

      <!-- Article Content (Manual format) -->
      <div class="mx-auto text-gray-700 text-lg leading-relaxed space-y-6">
        <p class="text-xl leading-relaxed text-gray-600 mb-8 italic">
          {{ post.excerpt }}
        </p>

        <!-- Mapping Paragraphs -->
        <template v-for="(paragraph, idx) in paragraphs" :key="idx">
          <p>{{ paragraph }}</p>

          <!-- Middle Ad Slot: Injected after 3rd paragraph -->
          <!-- <div v-if="idx === 2 && paragraphs.length > 4" class="my-10 w-full bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center p-4 min-h-[250px] text-gray-400 rounded-xl">
             <span class="text-xs uppercase tracking-widest font-semibold mb-1">Advertisement (300x250)</span>
          </div> -->
        </template>
      </div>

      <!-- Ad Slot: Bottom Content Banner -->
      <!-- <div class="mt-16 w-full bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center p-4 min-h-[90px] text-gray-400 rounded-xl">
         <span class="text-xs uppercase tracking-widest font-semibold mb-1">Advertisement</span>
      </div> -->
    </article>

    <!-- Related Posts -->
    <section
      v-if="latestPosts.length > 0"
      class="mt-16 border-t border-gray-200 pt-16"
    >
      <h3 class="mb-8 font-display text-2xl font-bold text-gray-900">
        Read Next
      </h3>
      <div class="grid gap-6 md:grid-cols-3">
        <RouterLink
          v-for="item in latestPosts"
          :key="item.id"
          :to="`/post/${item.slug}`"
          class="group block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
        >
          <img
            :src="item.cover"
            :alt="item.title"
            class="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <div class="p-4">
            <h4
              class="font-display text-lg font-bold leading-tight text-gray-900 group-hover:text-brand-600"
            >
              {{ item.title }}
            </h4>
            <div class="mt-4 text-xs font-medium text-gray-500">
              {{ item.publishedAt }}
            </div>
          </div>
        </RouterLink>
      </div>
    </section>
  </main>
</template>
