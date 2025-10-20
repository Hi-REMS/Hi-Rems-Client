<template>
  <div
    class="auth"
    :style="{ '--auth-bg': `url(${require('@/assets/auth.jpg')})` }"
  >
    <div class="auth-inner">
      <!-- LEFT: 배경 일러스트 -->
      <div class="art-pad" aria-hidden="true"></div>

      <!-- RIGHT: 로그인 카드 -->
      <section class="auth-panel">
        <header class="platform-head" aria-labelledby="heroMain">
          <h1 id="heroMain" class="hero-title">
            지속가능한 에너지 <br />모니터링 플랫폼
          </h1>
          <p class="hero-sub">
            태양광·지열·태양열 설비의 발전량과 상태를 한 곳에서 확인하세요.
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
                <input
                  id="username"
                  v-model.trim="username"
                  type="text"
                  autocomplete="username"
                  placeholder="admin@company"
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

            <div class="row-between">
              <label class="check">
                <input type="checkbox" disabled />
                <span>로그인 상태 유지</span>
              </label>
              <router-link class="link" to="/findpassword"
                >비밀번호 찾기</router-link>
            </div>

            <button class="btn-teal" :disabled="loading">
              <span v-if="!loading">로그인</span>
              <span v-else class="spinner" aria-hidden="true"></span>
            </button>

            <p class="foot mt8">
              아직 계정이 없으신가요?
              <router-link to="/register">회원가입</router-link>
            </p>
          </form>
        </main>
      </section>
    </div>
  </div>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/register.css' 

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
// ...생략...
async login() {
  if (this.loading) return
  try {
    this.loading = true
    this.error = ''

    await api.post('/auth/login', {
      username: this.username,
      password: this.password
    })

    // redirect 처리
    const raw = this.$route.query.redirect
    let to = ''
    try {
      to = raw ? decodeURIComponent(String(raw)) : ''
    } catch { to = '' }

    // 허용/차단 규칙
    const BLOCKED = ['/login', '/register', '/reset', '/forgot', '/findpassword']
    const isUnsafe =
      !to ||
      !to.startsWith('/') ||                  // 내부 경로만 허용
      BLOCKED.some(p => to.startsWith(p))     // 위험 경로 차단

    if (!isUnsafe) {
      this.$router.replace(to)
      return
    }

    // 기본 목적지
    const { data } = await api.get('/auth/me')
    const isAdmin = data?.user?.username === 'admin'
    this.$router.replace(isAdmin ? '/home' : '/analysis/timeseries')
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
