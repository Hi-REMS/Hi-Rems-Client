<template>
  <div
    class="auth"
    :style="{ '--auth-bg': `url(${require('@/assets/auth.jpg')})` }"
  >
    <div class="auth-inner">
      <div class="art-pad" aria-hidden="true"></div>
      
      <section class="auth-panel">
        <img 
    src="@/assets/haeinlogo.png"
    alt="Hi-REMS 로고"
    class="auth-logo"
  />
        <header class="platform-head" aria-labelledby="heroMain">
          <h1 id="heroMain" class="hero-title">
            지속가능한 에너지 <br />모니터링 플랫폼
          </h1>
          <p class="hero-sub">
            재생에너지 발전 상태를 한 곳에서 확인하세요.
          </p>
        </header>

        <main class="auth-card" role="main" aria-labelledby="loginTitle">
          <header class="cardc-hd">
            <h2 id="loginTitle" style="color:#2d2d2d;">로그인</h2>
            <p class="sub">계정으로 대시보드에 접속하세요.</p>
          </header>

          <form class="cardc-form" @submit.prevent="login">
            <div class="field">
              <label for="username">아이디</label>
              <div class="pill">
                <input style="font-size:14.5px;"
                  id="username"
                  v-model.trim="username"
                  type="text"
                  autocomplete="username"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            <div class="field">
              <label for="password">비밀번호</label>
              <div class="pill">
                <input
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  autocomplete="current-password"
                  placeholder="********"
                  required
                  @keyup="checkCaps"
                />
                <button
                  type="button"
                  class="pill-action"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? '숨김' : '표시' }}
                </button>
              </div>
              <p v-if="capsOn" class="pw-error-text">Caps Lock이 켜져 있습니다.</p>
            </div>


            <button class="btn-teal" :disabled="loading">
              <span v-if="!loading">로그인</span>
              <span v-else class="spinner" aria-hidden="true"></span>
            </button>

<div class="auth-actions">
  <div class="act-row">
    <span class="act-label">회원가입이 필요하신가요?</span>
    <router-link to="/register" class="auth-link strong">회원가입</router-link>
  </div>

  <div class="act-row">
    <span class="act-label">비밀번호를 잊으셨나요?</span>
    <router-link to="/findpassword" class="auth-link">비밀번호 찾기</router-link>
  </div>
</div>
          </form>
        </main>
      </section>
    </div>
  </div>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/login.css'

const ADMIN_EMAILS = ['admin@company.com']

function normalize (v) {
  return (typeof v === 'string' ? v : '').trim().toLowerCase()
}
function isAdminUser (u) {
  const ident = normalize(u?.email || u?.username || '')
  return ADMIN_EMAILS.includes(ident) || u?.is_admin === true
}

export default {
  name: 'Login',
  data () {
    return {
      username: '',
      password: '',
      showPassword: false,
      capsOn: false,
      loading: false,
      error: ''
    }
  },
  methods: {
    checkCaps (e) {
      this.capsOn = e.getModifierState && e.getModifierState('CapsLock')
    },

    async login () {
      if (this.loading) return
      try {
        this.loading = true
        this.error = ''

        const { data: loginRes } = await api.post('/auth/login', {
          username: this.username,
          password: this.password
        })
        const loginUser = loginRes?.user || {}

        const admin = isAdminUser(loginUser)

        try {
          localStorage.setItem('isAdmin', String(!!admin))
          localStorage.setItem('username', loginUser.username || '')
          localStorage.setItem('worker', loginUser.worker || '')
          localStorage.setItem('phoneNumber', loginUser.phoneNumber || '')
          if (loginUser.email) localStorage.setItem('email', loginUser.email)
        } catch {}

        if (admin) {
          this.$router.replace('/home')
          return
        }

        let defaultImei = ''
        try {
          const { data: imeiRes } = await api.get('/user/imeis')
          defaultImei = imeiRes?.defaultImei || ''
          if (defaultImei) {
            localStorage.setItem('defaultImei', defaultImei)
          } else {
            localStorage.removeItem('defaultImei')
            sessionStorage.removeItem('defaultImei')
          }
        } catch (e) {
          localStorage.removeItem('defaultImei')
          sessionStorage.removeItem('defaultImei')
        }
        const raw = this.$route.query.redirect
        let to = ''
        try { to = raw ? decodeURIComponent(String(raw)) : '' } catch { to = '' }

        const BLOCKED = ['/login', '/register', '/reset', '/forgot', '/findpassword']
        const isUnsafe = !to || !to.startsWith('/') || BLOCKED.some(p => to.startsWith(p))

        if (!isUnsafe) {
          this.$router.replace(to)
          return
        }

        if (defaultImei) {
          this.$router.replace(`/analysis/timeseries?imei=${encodeURIComponent(defaultImei)}`)
        } else {
          this.$router.replace({ path: '/analysis/timeseries', query: {} })
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || '로그인 실패'
        if (
          msg.includes('아이디') || msg.includes('비밀번호') ||
          msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('unauthorized')
        ) {
          alert('아이디 또는 비밀번호가 올바르지 않습니다.')
        } else {
          alert(`로그인 실패: ${msg}`)
        }
        this.error = msg
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
