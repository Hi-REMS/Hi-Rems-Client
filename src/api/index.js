// src/api/index.js
import axios from 'axios'
export const api = axios.create({
  baseURL: '/api',           // 프록시가 /api를 3000으로 전달
  timeout: 10000,
})
