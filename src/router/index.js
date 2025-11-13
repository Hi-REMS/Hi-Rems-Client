// src/router/index.js
import Vue from 'vue'
import Router from 'vue-router'
import { api } from '@/api'

import Home from '@/views/Home.vue'
import EnergyDashboard from '@/views/EnergyDashboard.vue'
import AnalysisTimeseries from '@/views/AnalysisTimeseries.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import FindPassword from '@/views/FindPassword.vue'
import ResetPassword from '@/views/ResetPassword.vue'
import ChangePassword from '@/views/ChangePassword.vue'
import Members from '@/views/admin/Members.vue'
Vue.use(Router)

// 이메일 기반 관리자 식별 로직 (라우터 전역 공통)
const ADMIN_EMAILS = ['admin@company.com']
function normalize (v) {
  return (typeof v === 'string' ? v : '').trim().toLowerCase()
}
function isAdminUser (u) {
  const ident = normalize(u?.email || u?.username || '')
  return ADMIN_EMAILS.includes(ident) || u?.is_admin === true
}

const router = new Router({
  mode: 'hash',
  base: '/hirems/',
  routes: [
    // 루트에서 로그인 여부/역할로 분기
    {
      path: '/',
      meta: { hideHeader: true },
      beforeEnter: async (to, from, next) => {
        try {
          const { data } = await api.get('/auth/me')
          const user = data?.user
          if (user) {
            return next(isAdminUser(user) ? '/home' : '/analysis/timeseries')
          }
        } catch {}
        return next('/login')
      }
    },

    // 공개 페이지 (항상 와일드카드 위)
    { path: '/login', component: Login, meta: { hideHeader: true } },
    { path: '/register', component: Register, meta: { hideHeader: true } },
    { path: '/findpassword', name: 'FindPassword', component: FindPassword, meta: { hideHeader: true } },
    { path: '/change-password', name: 'ChangePassword', component: ChangePassword, meta: { hideHeader: true } },
    { path: '/reset', component: ResetPassword, meta: { hideHeader: true } },

    // 보호 라우트
    { path: '/home', component: Home, meta: { requiresAuth: true, hideHeader: false } },
    { path: '/analysis/timeseries', component: AnalysisTimeseries, meta: { requiresAuth: true, hideHeader: false } },
    { path: '/energy', name: 'EnergyDashboard', component: EnergyDashboard, meta: { requiresAuth: true, hideHeader: false } },
    { path: '/admin/members',name: 'AdminMembers', component: Members, meta: { requiresAuth: true }},
    // 항상 마지막
    { path: '*', redirect: '/' }
  ],
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { selector: to.hash }
    return { x: 0, y: 0 }
  }
})

router.afterEach(() => {
  requestAnimationFrame(() => {
    window.scrollTo(0, 0)
    document.querySelectorAll('.ts-page, .edb-page').forEach(el => {
      el.scrollTop = 0
    })
  })
})

router.beforeEach(async (to, from, next) => {
  // 🔥 로그인 페이지는 절대 자동 리다이렉트 금지
  if (to.path === '/login') {
    return next()
  }

  const PUBLIC = ['/login', '/register', '/findpassword', '/reset']
  const isPublic = PUBLIC.some(p => to.path.startsWith(p))

  const getMe = async () => {
    try {
      const { data } = await api.get('/auth/me')
      return data?.user || null
    } catch {
      return null
    }
  }

  // 보호 라우트 접근
  if (to.matched.some(r => r.meta.requiresAuth)) {
    const me = await getMe()
    if (me) {
      // 비관리자가 /home 접근 → 차단
      if (to.path === '/home' && !isAdminUser(me)) {
        return next('/analysis/timeseries')
      }
      return next()
    }

    // 미인증 → 로그인
    const safeRedirect = (() => {
      const raw = to.fullPath || ''
      const BLOCKED = ['/login','/register','/reset','/findpassword']
      if (!raw.startsWith('/')) return ''
      if (BLOCKED.some(p => raw.startsWith(p))) return ''
      return raw
    })()
    return next(safeRedirect ? `/login?redirect=${encodeURIComponent(safeRedirect)}` : '/login')
  }

  // 이미 로그인 상태에서 /register 접근하면 리다이렉트
  if (isPublic && to.path === '/register') {
    const me = await getMe()
    if (me) {
      const defaultPath = isAdminUser(me) ? '/home' : '/analysis/timeseries'

      let toAfterLogin = to.query.redirect || ''
      const BLOCKED = ['/login','/register','/reset','/findpassword']
      const isSafe = toAfterLogin && toAfterLogin.startsWith('/') && !BLOCKED.some(p => toAfterLogin.startsWith(p))
      if (!isSafe) toAfterLogin = defaultPath

      if (to.fullPath === toAfterLogin) return next()
      return next(toAfterLogin)
    }
    return next()
  }

  next()
})

export default router
