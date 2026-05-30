import axios from 'axios'

let _token: string | null = null

export function setApiToken(t: string | null) {
  _token = t
}

const api = axios.create({ baseURL: '/api/v1' })

api.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`
  }
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
