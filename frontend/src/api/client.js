import axios from 'axios'

/**
 * Cookie-based Sanctum client.
 *
 * All API calls go through the Vite proxy: `/api` -> Laravel, and the CSRF
 * handshake goes to `/sanctum/csrf-cookie`. No bearer token is ever stored in
 * the browser; the session cookie is httpOnly and SameSite-aware.
 */
const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

/** Fetch a fresh CSRF cookie from Sanctum. Called before every mutation. */
export function ensureCsrf() {
  return axios.get('/sanctum/csrf-cookie', {
    withCredentials: true,
    headers: { Accept: 'application/json' },
  })
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const code = error?.response?.data?.code
    const url = error?.config?.url || ''
    const path = typeof window !== 'undefined' ? window.location.pathname : ''

    // A failed login/register on the auth screen is not a lost session.
    const isAuthAttempt = /\/login|\/register|\/forgot-password|\/reset-password/.test(url)

    if (status === 401 && !isAuthAttempt && !/^\/login/.test(path)) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    if (status === 403 && code === 'PASSWORD_CHANGE_REQUIRED') {
      window.dispatchEvent(new CustomEvent('auth:password-change-required'))
    }

    return Promise.reject(error)
  },
)

async function mutate(method, url, data, config = {}) {
  await ensureCsrf()
  return client.request({ method, url, data, ...config })
}

/** Thin wrapper that guarantees the CSRF handshake for write operations. */
export const api = {
  get: (url, config) => client.get(url, config),
  post: (url, data, config) => mutate('post', url, data, config),
  put: (url, data, config) => mutate('put', url, data, config),
  patch: (url, data, config) => mutate('patch', url, data, config),
  delete: (url, config) => mutate('delete', url, undefined, config),
}

/** Human-readable message from a Laravel validation/error response. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data

  if (data?.message && typeof data.message === 'string') return data.message

  if (data?.errors && typeof data.errors === 'object') {
    const firstField = Object.values(data.errors).find(
      (messages) => Array.isArray(messages) && messages.length > 0,
    )
    if (firstField?.[0]) return firstField[0]
  }

  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?'

  return error?.message || fallback
}

/** Laravel validation errors keyed by field name. */
export function getFieldErrors(error) {
  const errors = error?.response?.data?.errors
  return errors && typeof errors === 'object' ? errors : {}
}

/** Request a CSV endpoint and save it using the browser download attribute. */
export async function downloadCsv(url, params = {}, filename = 'export.csv') {
  const response = await client.get(url, { params, responseType: 'blob' })

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}

export default client
