import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to login on 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_email')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  register: (email, password) =>
    client.post('/auth/register', { email, password }),

  login: (email, password) =>
    client.post('/auth/login', { email, password }),
}

// ── Documents ─────────────────────────────────────────
export const documentsAPI = {
  list: () =>
    client.get('/documents/'),

  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (docId) =>
    client.delete(`/documents/${docId}`),
}

// ── Ask ───────────────────────────────────────────────
export const askAPI = {
  ask: (question, webSearch = false) =>
    client.post('/ask', { question, web_search: webSearch }),
}

// ── Upload (session-scoped, no auth needed) ───────────
export const uploadAPI = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  clearUpload: () =>
    client.delete('/clear-upload'),
}

export default client
