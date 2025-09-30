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
  mode: 'hash',                  // 새로고침 404 방지
  base: '/hirems/',     // (hash 모드에선 큰 의미 없지만 유지해도 무방)
  routes: [
    { path: '/', redirect: '/login' }, 
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/home', component: Home },
    { path: '/analysis/timeseries', component: AnalysisTimeseries },
    { path: '/energy', name: 'EnergyDashboard', component: EnergyDashboard },
    { path: '*', redirect: '/' }
  ],

  // 라우트 변경 시 스크롤 처리
  scrollBehavior (to, from, savedPosition) {
    // 브라우저 뒤/앞으로 가기는 저장된 위치로
    if (savedPosition) return savedPosition
    // 앵커(#section)가 있으면 그 위치로
    if (to.hash) return { selector: to.hash }
    // 그 외에는 항상 화면 맨 위로
    return { x: 0, y: 0 }
  }
})

// (선택) 커스텀 스크롤 컨테이너도 쓰는 경우 함께 리셋
router.afterEach(() => {
  requestAnimationFrame(() => {
    // 윈도우 스크롤
    window.scrollTo(0, 0)
    // 페이지 내부 스크롤 컨테이너들(프로젝트에 맞춰 선택자 추가/수정)
    document.querySelectorAll('.ts-page, .edb-page').forEach(el => {
      el.scrollTop = 0
    })
  })
})

/*  인증 가드 */
router.beforeEach(async (to, from, next) => {
  if (to.matched.some(r => r.meta.requiresAuth)) {
    try {
      await api.get('/auth/me', { withCredentials: true })
      next() // 인증 성공
    } catch (e) {
      next('/login') // 인증 실패 → 로그인 페이지로
    }
  } else if (to.path === '/login' || to.path === '/register') {
    try {
      await api.get('/auth/me', { withCredentials: true })
      next('/home') // 이미 로그인 상태면 대시보드로
    } catch {
      next() // 로그인 안 되어 있으면 그대로 진입 허용
    }
  } else {
    next()
  }
})
export default router
