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
function normalize(v) {
  return (typeof v === 'string' ? v : '').trim().toLowerCase()
}
function isAdminUser(u) {
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
      beforeEnter: (to, from, next) => {
        const token = localStorage.getItem('token');
        if (token) return next('/home');
        next('/login');
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
      meta: { requiresAuth: true, hideHeader: false } 
    },

    { path: '/analysis/timeseries', component: AnalysisTimeseries, meta: { requiresAuth: true, hideHeader: false } },
    { path: '/energy', name: 'EnergyDashboard', component: EnergyDashboard, meta: { requiresAuth: true, hideHeader: false } },
    
    { 
      path: '/admin/members',
      name: 'AdminMembers', 
      component: Members, 
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    { path: '*', redirect: '/' }
  ],
  scrollBehavior(to, from, savedPosition) {
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
  const token = localStorage.getItem('token');
  const PUBLIC_PATHS = ['/login', '/register', '/findpassword', '/reset'];
  const isPublic = PUBLIC_PATHS.some(p => to.path.startsWith(p));

  if (!token) {
    if (isPublic) return next();
    return next('/login');
  }

  let user = null;
  try {
    const { data } = await api.get('/auth/me');
    user = data?.user;
  } catch (e) {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    if (isPublic) return next();
    return next('/login');
  }

  if (user && isPublic) {
    return next('/home');
  }

  if (to.matched.some(r => r.meta.requiresAdmin)) {
    if (user && isAdminUser(user)) {
      return next();
    } else {
      alert('관리자 권한이 필요합니다.');
      return next('/home');
    }
  }

  next();
})

export default router