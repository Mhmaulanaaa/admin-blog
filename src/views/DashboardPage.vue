<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { api } from "../api";
import { authState } from "../stores/auth";

const emptyForm = () => ({
  title: "",
  excerpt: "",
  category: "General",
  author: authState.user?.name ?? "Admin EasyTrends",
  cover: "",
  content: "",
  publishedAt: new Date().toISOString().slice(0, 10),
  status: "Published",
});

const posts = ref([]);
const search = ref("");
const loading = ref(true);
const saving = ref(false);
const generating = ref(false);
const error = ref("");
const success = ref("");
const editingId = ref(null);
const form = reactive(emptyForm());

const filteredPosts = computed(() => {
  const keyword = search.value.trim().toLowerCase();

  if (!keyword) {
    return posts.value;
  }

  return posts.value.filter((post) =>
    [post.title, post.category, post.author, post.status].some((value) =>
      value.toLowerCase().includes(keyword),
    ),
  );
});

const publishedCount = computed(
  () => posts.value.filter((post) => post.status === "Published").length,
);

function resetForm() {
  Object.assign(form, emptyForm());
  editingId.value = null;
  error.value = "";
  success.value = "";
}

async function loadPosts() {
  loading.value = true;
  error.value = "";

  try {
    const payload = await api("/admin/posts");
    posts.value = payload.posts;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function autoGenerate() {
  const topic = window.prompt("Masukkan Topik Artikel yang ingin dibuat AI:");
  if (!topic) return;

  generating.value = true;
  error.value = "";
  success.value = "";

  try {
    const payload = await api("/admin/generate", {
      method: "POST",
      body: JSON.stringify({ topic }),
    });

    form.title = payload.title || "";
    form.excerpt = payload.excerpt || "";
    form.category = payload.category || "";
    form.content = payload.content || "";
    form.cover = payload.cover || form.cover;

    success.value =
      "Artikel berhasil di-generate secara otomatis! Silakan edit & Publish.";
  } catch (err) {
    error.value = err.message;
  } finally {
    generating.value = false;
  }
}

function startEdit(post) {
  editingId.value = post.id;
  Object.assign(form, {
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    author: post.author,
    cover: post.cover,
    content: post.content,
    publishedAt: post.publishedAt,
    status: post.status,
  });
  success.value = "";
}

async function savePost() {
  saving.value = true;
  error.value = "";
  success.value = "";

  try {
    if (editingId.value) {
      await api(`/admin/posts/${editingId.value}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      success.value = "Posting berhasil diperbarui.";
    } else {
      await api("/admin/posts", {
        method: "POST",
        body: JSON.stringify(form),
      });
      success.value = "Posting baru berhasil disimpan.";
    }

    resetForm();
    await loadPosts();
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function deletePost(id) {
  const confirmed = window.confirm("Hapus posting ini?");

  if (!confirmed) {
    return;
  }

  error.value = "";
  success.value = "";

  try {
    await api(`/admin/posts/${id}`, {
      method: "DELETE",
    });

    if (editingId.value === id) {
      resetForm();
    }

    success.value = "Posting berhasil dihapus.";
    await loadPosts();
  } catch (err) {
    error.value = err.message;
  }
}

onMounted(loadPosts);
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <div
      class="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-sm text-gray-500">
          Welcome back, {{ authState.user?.name ?? "Admin" }}
        </p>
      </div>
      <div class="flex gap-4">
        <div class="rounded-lg bg-white px-4 py-2 border border-gray-200">
          <span class="text-xs text-gray-500 uppercase font-semibold"
            >Total Posts:</span
          >
          <span class="ml-2 font-bold text-gray-900">{{ posts.length }}</span>
        </div>
        <div class="rounded-lg bg-brand-50 px-4 py-2 border border-brand-100">
          <span class="text-xs text-brand-600 uppercase font-semibold"
            >Published:</span
          >
          <span class="ml-2 font-bold text-brand-700">{{
            publishedCount
          }}</span>
        </div>
      </div>
    </div>

    <div class="grid gap-8 lg:grid-cols-[1fr_2fr]">
      <!-- Form Input -->
      <section>
        <div
          class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
        >
          <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 class="font-semibold text-gray-900">
              {{ editingId ? "Edit Post" : "Create New Post" }}
            </h2>
          </div>
          <form class="p-6 space-y-4" @submit.prevent="savePost">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Title</label
              >
              <input
                v-model="form.title"
                type="text"
                required
                class="w-full rounded-md border border-gray-300 px-3 py-2 shrink shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Excerpt</label
              >
              <textarea
                v-model="form.excerpt"
                rows="2"
                required
                class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Category</label
                >
                <input
                  v-model="form.category"
                  type="text"
                  required
                  class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Author</label
                >
                <input
                  v-model="form.author"
                  type="text"
                  required
                  class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Date</label
                >
                <input
                  v-model="form.publishedAt"
                  type="date"
                  required
                  class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-gray-700"
                  >Status</label
                >
                <select
                  v-model="form.status"
                  class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                >
                  <option>Published</option>
                  <option>Draft</option>
                </select>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Cover URL</label
              >
              <input
                v-model="form.cover"
                type="url"
                required
                class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700"
                >Content</label
              >
              <textarea
                v-model="form.content"
                rows="6"
                required
                class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
              ></textarea>
            </div>

            <div
              v-if="error"
              class="rounded-md bg-red-50 p-3 text-sm text-red-700"
            >
              {{ error }}
            </div>
            <div
              v-if="success"
              class="rounded-md bg-green-50 p-3 text-sm text-green-700"
            >
              {{ success }}
            </div>

            <div class="flex gap-3 pt-2">
              <button
                type="submit"
                :disabled="saving"
                class="flex-1 justify-center rounded-md border border-transparent bg-brand-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {{
                  saving
                    ? "Saving..."
                    : editingId
                      ? "Update Post"
                      : "Publish Post"
                }}
              </button>
              <button
                type="button"
                @click="resetForm"
                class="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- Post List -->
      <section>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-medium text-gray-900">Content Library</h2>
          <input
            v-model="search"
            type="search"
            placeholder="Search posts..."
            class="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div v-if="loading" class="space-y-3">
          <div
            v-for="i in 3"
            :key="i"
            class="h-24 rounded-lg bg-gray-200 animate-pulse"
          ></div>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="post in filteredPosts"
            :key="post.id"
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            <div class="flex items-center gap-4">
              <img
                :src="post.cover"
                class="h-16 w-16 rounded-md object-cover flex-shrink-0"
              />
              <div>
                <h3 class="font-bold text-gray-900">{{ post.title }}</h3>
                <div class="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span class="rounded bg-gray-100 px-2 py-0.5">{{
                    post.category
                  }}</span>
                  <span
                    :class="
                      post.status === 'Published'
                        ? 'text-green-600'
                        : 'text-amber-600'
                    "
                    >{{ post.status }}</span
                  >
                  <span>&bull;</span>
                  <span>{{ post.publishedAt }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button
                @click="startEdit(post)"
                class="flex-1 sm:flex-none rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                @click="deletePost(post.id)"
                class="flex-1 sm:flex-none rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-600 border border-gray-300 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>

          <div
            v-if="filteredPosts.length === 0"
            class="py-8 text-center text-sm text-gray-500 border border-dashed border-gray-300 rounded-xl"
          >
            No posts found. Create one.
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
