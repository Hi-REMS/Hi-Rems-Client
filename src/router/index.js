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
        } catch {    console.log("여기0");}
        return next('/login')
      }
    },
    { path: '/login', component: Login, meta: { hideHeader: true } },
    { path: '/register', component: Register, meta: { hideHeader: true } },
    { path: '/findpassword', name: 'FindPassword', component: FindPassword, meta: { hideHeader: true } },
    { path: '/change-password', name: 'ChangePassword', component: ChangePassword, meta: { hideHeader: true } },
    { path: '/reset', component: ResetPassword, meta: { hideHeader: true } },
    
    { 
      path: '/home', 
      component: Home, 
      meta: { requiresAuth: true, hideHeader: false },
      beforeEnter: async (to, from, next) => {
        try {
          const { data } = await api.get('/auth/me')
          const user = data?.user
          
          if (user && isAdminUser(user)) {
            next()
          } else {
            alert('관리자만 접근할 수 있는 페이지입니다.')
            next('/analysis/timeseries')
          }
        } catch (e) {
          next('/login')
        }
      }
    },

    { path: '/analysis/timeseries', component: AnalysisTimeseries, meta: { requiresAuth: true, hideHeader: false } },
    { path: '/energy', name: 'EnergyDashboard', component: EnergyDashboard, meta: { requiresAuth: true, hideHeader: false } },
    
    { 
      path: '/admin/members',
      name: 'AdminMembers', 
      component: Members, 
      meta: { requiresAuth: true },
      beforeEnter: async (to, from, next) => {
        try {
          const { data } = await api.get('/auth/me')
          const user = data?.user
          if (user && isAdminUser(user)) {
            next()
          } else {
            alert('관리자 권한이 필요합니다.')
            next('/analysis/timeseries')
          }
        } catch (e) {
          next('/login')
        }
      }
    },
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
  
  if (to.matched.some(r => r.meta.requiresAuth)) {
    const me = await getMe()
    if (me) {
      return next()
    }
    const safeRedirect = (() => {
      const raw = to.fullPath || ''
      const BLOCKED = ['/login','/register','/reset','/findpassword']
      if (!raw.startsWith('/')) return ''
      if (BLOCKED.some(p => raw.startsWith(p))) return ''
      return raw
    })()
    return next(safeRedirect ? `/login?redirect=${encodeURIComponent(safeRedirect)}` : '/login')
  }

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