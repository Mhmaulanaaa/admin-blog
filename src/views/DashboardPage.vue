<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../api'
import { authState } from '../stores/auth'

const emptyForm = () => ({
  title: '',
  excerpt: '',
  category: 'General',
  author: authState.user?.name ?? 'Admin StoryFlow',
  cover: '',
  content: '',
  publishedAt: new Date().toISOString().slice(0, 10),
  status: 'Published',
})

const posts = ref([])
const search = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const editingId = ref(null)
const form = reactive(emptyForm())

const filteredPosts = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  if (!keyword) {
    return posts.value
  }

  return posts.value.filter((post) =>
    [post.title, post.category, post.author, post.status].some((value) =>
      value.toLowerCase().includes(keyword),
    ),
  )
})

const publishedCount = computed(() => posts.value.filter((post) => post.status === 'Published').length)

function resetForm() {
  Object.assign(form, emptyForm())
  editingId.value = null
}

async function loadPosts() {
  loading.value = true
  error.value = ''

  try {
    const payload = await api('/admin/posts')
    posts.value = payload.posts
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function startEdit(post) {
  editingId.value = post.id
  Object.assign(form, {
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    author: post.author,
    cover: post.cover,
    content: post.content,
    publishedAt: post.publishedAt,
    status: post.status,
  })
  success.value = ''
}

async function savePost() {
  saving.value = true
  error.value = ''
  success.value = ''

  try {
    if (editingId.value) {
      await api(`/admin/posts/${editingId.value}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      success.value = 'Posting berhasil diperbarui.'
    } else {
      await api('/admin/posts', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      success.value = 'Posting baru berhasil disimpan.'
    }

    resetForm()
    await loadPosts()
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function deletePost(id) {
  const confirmed = window.confirm('Hapus posting ini?')

  if (!confirmed) {
    return
  }

  error.value = ''
  success.value = ''

  try {
    await api(`/admin/posts/${id}`, {
      method: 'DELETE',
    })

    if (editingId.value === id) {
      resetForm()
    }

    success.value = 'Posting berhasil dihapus.'
    await loadPosts()
  } catch (err) {
    error.value = err.message
  }
}

onMounted(loadPosts)
</script>

<template>
  <main class="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:py-16">
    <section class="space-y-6">
      <div class="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-soft">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Dashboard Manager</p>
        <h1 class="mt-2 font-display text-3xl font-bold text-slate-900">
          {{ editingId ? 'Edit posting' : 'Buat posting baru' }}
        </h1>
        <p class="mt-3 leading-7 text-slate-600">
          Login sebagai <strong>{{ authState.user?.name ?? 'Admin' }}</strong>. Semua perubahan akan
          tersimpan permanen di database SQLite backend.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="rounded-[1.5rem] border border-white/70 bg-white/90 p-6 shadow-soft">
          <p class="text-sm text-slate-500">Total Post</p>
          <p class="mt-2 font-display text-3xl font-bold text-slate-900">{{ posts.length }}</p>
        </div>
        <div class="rounded-[1.5rem] border border-white/70 bg-white/90 p-6 shadow-soft">
          <p class="text-sm text-slate-500">Published</p>
          <p class="mt-2 font-display text-3xl font-bold text-slate-900">{{ publishedCount }}</p>
        </div>
      </div>

      <form class="space-y-4 rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-soft" @submit.prevent="savePost">
        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">Judul</label>
          <input
            v-model="form.title"
            type="text"
            required
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">Ringkasan singkat</label>
          <textarea
            v-model="form.excerpt"
            rows="3"
            required
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white"
          />
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Kategori</label>
            <input
              v-model="form.category"
              type="text"
              required
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Author</label>
            <input
              v-model="form.author"
              type="text"
              required
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white"
            />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Tanggal publish</label>
            <input
              v-model="form.publishedAt"
              type="date"
              required
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-slate-700">Status</label>
            <select
              v-model="form.status"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white"
            >
              <option>Published</option>
              <option>Draft</option>
            </select>
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">Cover image URL</label>
          <input
            v-model="form.cover"
            type="url"
            required
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-semibold text-slate-700">Isi artikel</label>
          <textarea
            v-model="form.content"
            rows="9"
            required
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white"
          />
        </div>

        <div v-if="error" class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ error }}
        </div>

        <div v-if="success" class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {{ success }}
        </div>

        <div class="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            :disabled="saving"
            class="rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {{ saving ? 'Menyimpan...' : editingId ? 'Update Post' : 'Publish Post' }}
          </button>
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300"
            @click="resetForm"
          >
            Reset
          </button>
        </div>
      </form>
    </section>

    <section class="space-y-6">
      <div class="rounded-[2rem] border border-white/70 bg-white/90 p-8 shadow-soft">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Content List</p>
            <h2 class="mt-2 font-display text-3xl font-bold text-slate-900">Daftar posting</h2>
          </div>
          <input
            v-model="search"
            type="search"
            placeholder="Cari judul, kategori, status..."
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-400 focus:bg-white md:max-w-xs"
          />
        </div>
      </div>

      <div v-if="loading" class="space-y-4">
        <div class="h-44 animate-pulse rounded-[1.75rem] bg-slate-200"></div>
        <div class="h-44 animate-pulse rounded-[1.75rem] bg-slate-100"></div>
      </div>

      <div v-else class="space-y-4">
        <article
          v-for="post in filteredPosts"
          :key="post.id"
          class="rounded-[1.75rem] border border-white/70 bg-white/90 p-6 shadow-soft"
        >
          <div class="flex flex-col gap-5 md:flex-row">
            <img
              :src="post.cover"
              :alt="post.title"
              class="h-40 w-full rounded-[1.25rem] object-cover md:w-52"
            />
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2 text-sm">
                <span class="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700">
                  {{ post.category }}
                </span>
                <span
                  class="rounded-full px-3 py-1 font-semibold"
                  :class="
                    post.status === 'Published'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  "
                >
                  {{ post.status }}
                </span>
              </div>
              <h3 class="mt-4 font-display text-2xl font-bold text-slate-900">{{ post.title }}</h3>
              <p class="mt-3 leading-7 text-slate-600">{{ post.excerpt }}</p>
              <div class="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>{{ post.author }}</span>
                <span>{{ post.publishedAt }}</span>
                <span>/post/{{ post.slug }}</span>
              </div>
              <div class="mt-5 flex flex-wrap gap-3">
                <button
                  class="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  @click="startEdit(post)"
                >
                  Edit
                </button>
                <button
                  class="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  @click="deletePost(post.id)"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
