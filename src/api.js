import { authState } from './stores/auth'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '/api'

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  }

  if (authState.token) {
    headers.Authorization = `Bearer ${authState.token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json() : null

  if (!response.ok) {
    throw new Error(payload?.message ?? 'Terjadi kesalahan pada server.')
  }

  return payload
}
