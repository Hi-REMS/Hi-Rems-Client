<template>
  <div class="login-page lp-shell">
    <!-- Hero -->
    <section class="lp-hero">
      <div class="lp-hero-inner">
        <div class="lp-badge">Hi-REMS · v1.0</div>
        <h1 class="lp-title">로그인</h1>
        <p class="lp-sub">
          태양광 · 지열 · 태양열 설비의 발전량과 상태를 한 곳에서 확인하세요.
        </p>

        <div class="lp-illustration" aria-hidden="true">
          <!-- 태양 -->
          <svg class="lp-sun" viewBox="0 0 100 100">
            <defs>
              <radialGradient id="lp-g-sun" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FFD56A"/>
                <stop offset="100%" stop-color="#FFA422"/>
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="26" fill="url(#lp-g-sun)"/>
          </svg>

          <!-- 패널 -->
          <svg class="lp-panel" viewBox="0 0 200 120">
            <defs>
              <linearGradient id="lp-g-panel" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#3B82F6"/>
                <stop offset="100%" stop-color="#0EA5E9"/>
              </linearGradient>
            </defs>
            <rect x="10" y="30" width="180" height="70" rx="8" fill="url(#lp-g-panel)"/>
            <g opacity=".25" stroke="#fff">
              <line x1="40" y1="30" x2="40" y2="100"/>
              <line x1="80" y1="30" x2="80" y2="100"/>
              <line x1="120" y1="30" x2="120" y2="100"/>
              <line x1="160" y1="30" x2="160" y2="100"/>
            </g>
          </svg>

          <!-- 지열 파형 -->
          <svg class="lp-wave" viewBox="0 0 600 120" preserveAspectRatio="none">
            <path d="M0,60 C120,20 240,100 360,60 C480,20 540,90 600,60 L600,120 L0,120 Z" />
          </svg>
        </div>
      </div>
    </section>

    <!-- 로그인 카드 -->
    <main class="lp-card">
      <header class="lp-card-head">
        <h2>로그인</h2>
        <p class="lp-muted">계정으로 대시보드에 접속하세요</p>
      </header>

      <form class="lp-form" @submit.prevent="login">
        <div class="lp-field">
          <label for="username">아이디</label>
          <div class="lp-control">
            <span class="lp-icon" aria-hidden="true">👤</span>
            <input
              id="username"
              v-model.trim="username"
              type="text"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <div class="lp-field">
          <label for="password">비밀번호</label>
          <div class="lp-control">
            <span class="lp-icon" aria-hidden="true">🔒</span>
            <input
              id="password"
              ref="pwd"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              autocomplete="current-password"
              required
              @keyup="checkCaps($event)"
            />
            <button
              type="button"
              class="lp-ghost"
              @click="showPassword = !showPassword"
              :aria-pressed="showPassword"
              :aria-label="showPassword ? '비밀번호 숨기기' : '비밀번호 보기'"
            >
              {{ showPassword ? '숨김' : '표시' }}
            </button>
          </div>
          <p v-if="capsOn" class="lp-assist lp-warn">Caps Lock이 켜져 있습니다</p>
        </div>

        <!-- 항상 동일 스타일의 버튼 -->
        <button class="lp-primary" type="submit">
          <span v-if="!loading">로그인</span>
          <span v-else class="lp-spinner" aria-hidden="true"></span>
        </button>

        <p v-if="error" class="lp-alert">{{ error }}</p>

        <p class="lp-foot">
          아직 계정이 없으신가요?
          <router-link to="/register">회원가입</router-link>
        </p>
      </form>

      <footer class="lp-card-foot">
        <small class="lp-muted">더 좋은 서비스 제공을 위해 노력하겠습니다.</small>
      </footer>
    </main>
  </div>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/login.css'

export default {
  name: 'Login',
  data() {
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
    checkCaps(e) {
      this.capsOn = e.getModifierState && e.getModifierState('CapsLock')
    },
async login() {
  if (this.loading) return
  try {
    this.loading = true
    this.error = ''

    // 로그인 요청 (쿠키 세팅)
    await api.post('/auth/login', {
      username: this.username,
      password: this.password
    })

    // redirect 쿼리 처리: 한 번만 decode + 유효성 검증
    const raw = this.$route.query.redirect
    let to = ''
    try {
      to = raw ? decodeURIComponent(String(raw)) : ''
    } catch {
      to = ''
    }

    // 로그인/회원가입 페이지로 보내는 redirect는 막음
    if (to && (to.startsWith('/login') || to.startsWith('/register'))) {
      to = ''
    }

    if (to) {
      this.$router.replace(to)
      return
    }

    // redirect가 없으면 서버 기준 사용자로 기본 분기
    try {
      const { data } = await api.get('/auth/me')  // { user: { id, username } }
      const isAdmin = data?.user?.username === 'admin'
      this.$router.replace(isAdmin ? '/home' : '/analysis/timeseries')
    } catch {
      // /auth/me 실패 시 안전 경로
      this.$router.replace('/analysis/timeseries')
    }
  } catch (err) {
    this.error = err?.response?.data?.message || '로그인 실패'
  } finally {
    this.loading = false
  }
}
  }
}
</script>
