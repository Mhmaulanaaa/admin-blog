import { reactive } from 'vue'
import { api } from '../api'

const tokenKey = 'storyflow-auth-token'

export const authState = reactive({
  token: localStorage.getItem(tokenKey) ?? '',
  user: null,
  ready: false,
})

function persistToken(token) {
  authState.token = token

  if (token) {
    localStorage.setItem(tokenKey, token)
    return
  }

  localStorage.removeItem(tokenKey)
}

export async function login(credentials) {
  const payload = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  persistToken(payload.token)
  authState.user = payload.user
  return payload.user
}

export async function bootstrapAuth() {
  if (!authState.token) {
    authState.ready = true
    return
  }

  try {
    const payload = await api('/auth/me')
    authState.user = payload.user
  } catch {
    persistToken('')
    authState.user = null
  } finally {
    authState.ready = true
  }
}

export function logout() {
  persistToken('')
  authState.user = null
}
