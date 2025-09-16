import Vue from 'vue'
import App from './App.vue'
import router from './router'

// 1) 전역 테마 CSS를 가장 먼저 import
import '@/assets/css/theme.css'

// 2) 테마 결정(저장값 → 시스템 선호 → 기본 dark)
const saved = localStorage.getItem('theme')
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
const theme = saved || (prefersDark ? 'dark' : 'light')


// 3) data-theme 속성 세팅
document.documentElement.setAttribute('data-theme', theme)

new Vue({ router, render: h => h(App) }).$mount('#app')
