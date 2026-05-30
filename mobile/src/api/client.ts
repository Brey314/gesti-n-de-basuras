import axios from 'axios'

const TOKEN_KEY = 'mb_jwt'

let _token: string | null = localStorage.getItem(TOKEN_KEY)

export function setApiToken(t: string | null) {
  _token = t
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

const api = axios.create({ baseURL: '/api/v1' })

api.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(err)
  },
)

export default api
