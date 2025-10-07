import axios from 'axios'
export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE })
api.interceptors.request.use(cfg => {
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken')
    if (t) cfg.headers.Authorization = `Bearer ${t}`
  }
  return cfg
})
