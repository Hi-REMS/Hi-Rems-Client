import Vue from 'vue'
import App from './App.vue'
import router from './router'

import '@/assets/css/theme.css'

const saved = localStorage.getItem('theme')
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
const theme = saved || (prefersDark ? 'dark' : 'light')

document.documentElement.setAttribute('data-theme', theme)

new Vue({ router, render: h => h(App) }).$mount('#app')
