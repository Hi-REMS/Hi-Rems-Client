// src/router/index.js
import Vue from 'vue'
import Router from 'vue-router'
import { api } from '@/api'

import Home from '@/views/Home.vue'
import EnergyDashboard from '@/views/EnergyDashboard.vue'
import AnalysisTimeseries from '@/views/AnalysisTimeseries.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'

Vue.use(Router)

const router = new Router({
  mode: 'hash',                     // 새로고침 404 방지
  base: '/hirems/frontend/',        // hash 모드에선 영향 적지만 유지해도 OK
  routes: [
    { path: '/', redirect: '/login',meta: { hideHeader: true }},
    { path: '/login', component: Login, meta: { hideHeader: true }  },
    { path: '/register', component: Register, meta: { hideHeader: true }},
    // ✅ 보호 라우트들에 requiresAuth
    { path: '/home', component: Home, meta: { requiresAuth: true, hideHeader : false } },
    { path: '/analysis/timeseries', component: AnalysisTimeseries, meta: { requiresAuth: true, hideHeader : false} },
    { path: '/energy', name: 'EnergyDashboard', component: EnergyDashboard, meta: { requiresAuth: true, hideHeader : false} },

    { path: '*', redirect: '/' }
  ],

  // 라우트 변경 시 스크롤 처리
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { selector: to.hash }
    return { x: 0, y: 0 }
  }
})

// (선택) 커스텀 스크롤 컨테이너 리셋
router.afterEach(() => {
  requestAnimationFrame(() => {
    window.scrollTo(0, 0)
    document.querySelectorAll('.ts-page, .edb-page').forEach(el => {
      el.scrollTop = 0
    })
  })
})

/* ───────────────── 인증 가드 ─────────────────
   - 보호 라우트 진입 시 /auth/me로 로그인 여부 확인
   - 미인증이면 /login?redirect=원래경로 로 보냄
   - 이미 로그인 상태에서 /login·/register 접근 시 redirect 또는 /home
*/
router.beforeEach(async (to, from, next) => {
  const isAuthPage = (to.path === '/login' || to.path === '/register')

  // /auth/me 호출 헬퍼 (쿠키는 axios 인스턴스가 자동 포함)
  const checkAuth = async () => {
    try {
      await api.get('/auth/me')
      return true
    } catch {
      return false
    }
  }

  if (to.matched.some(r => r.meta.requiresAuth)) {
    // 보호 라우트
    const ok = await checkAuth()
    if (ok) return next()

    // 미인증 → 로그인으로, 원래 경로를 redirect 쿼리로 전달
    const redirect = encodeURIComponent(to.fullPath)
    return next(`/login?redirect=${redirect}`)
  }

  if (isAuthPage) {
    // 로그인/회원가입 페이지에 들어오려는 경우, 이미 로그인 상태면 돌려보냄
    const ok = await checkAuth()
    if (ok) {
      // 쿼리에 redirect가 있으면 우선 사용
      const toAfterLogin = to.query.redirect || '/home'
      if (to.fullPath === toAfterLogin) return next() // 무한루프 방지
      return next(toAfterLogin)
    }
    return next()
  }
  return next()
})

export default router
