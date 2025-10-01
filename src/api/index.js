// src/api/index.js
import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err?.response?.status === 401) {
      const hash = location.hash || '' 
      const isOnLogin = /^#\/login(?:\?|$)/.test(hash)

      //  이미 로그인 페이지면 또 리다이렉트 금지 (루프 방지)
      if (!isOnLogin) {
        const current = hash.slice(1) || '/'   
        const redirect = encodeURIComponent(current)
        location.hash = `#/login?redirect=${redirect}`
      }
    }
    return Promise.reject(err)
  }
)
