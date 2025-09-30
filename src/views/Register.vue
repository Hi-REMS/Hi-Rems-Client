<template>
  <div class="register-page rp-shell">
    <!-- Hero -->
    <section class="rp-hero">
      <div class="rp-hero-inner">
        <div class="rp-badge">Hi-REMS · v1.0</div>
        <h1 class="rp-title">회원가입</h1>
        <p class="rp-sub">
          태양광 · 지열 · 태양열 설비의 발전량을 모니터링하려면 먼저 계정을 생성하세요.
        </p>

        <div class="rp-illustration" aria-hidden="true">
          <!-- 태양 -->
          <svg class="rp-sun" viewBox="0 0 100 100">
            <defs>
              <radialGradient id="g-sun-r" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FFD56A"/>
                <stop offset="100%" stop-color="#FFA422"/>
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="26" fill="url(#g-sun-r)"/>
          </svg>

          <!-- 패널 -->
          <svg class="rp-panel" viewBox="0 0 200 120">
            <defs>
              <linearGradient id="g-panel-r" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#3B82F6"/>
                <stop offset="100%" stop-color="#0EA5E9"/>
              </linearGradient>
            </defs>
            <rect x="10" y="30" width="180" height="70" rx="8" fill="url(#g-panel-r)"/>
            <g opacity=".25" stroke="#fff">
              <line x1="40" y1="30" x2="40" y2="100"/>
              <line x1="80" y1="30" x2="80" y2="100"/>
              <line x1="120" y1="30" x2="120" y2="100"/>
              <line x1="160" y1="30" x2="160" y2="100"/>
            </g>
          </svg>

          <!-- 지열 파형 -->
          <svg class="rp-wave" viewBox="0 0 600 120" preserveAspectRatio="none">
            <path d="M0,60 C120,20 240,100 360,60 C480,20 540,90 600,60 L600,120 L0,120 Z" />
          </svg>
        </div>
      </div>
    </section>

    <!-- 카드 -->
    <main class="rp-card">
      <header class="rp-card-head">
        <h2>회원가입</h2>
        <p class="rp-muted">새 계정을 만들어 대시보드를 이용해 보세요</p>
      </header>

      <form class="rp-form" @submit.prevent="onSubmit">
        <!-- 아이디 -->
        <div class="rp-field">
          <label for="username">아이디</label>
          <div class="rp-control">
            <span class="rp-icon" aria-hidden="true">👤</span>
            <input
              id="username"
              v-model.trim="username"
              type="text"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <!-- 비밀번호 -->
        <div class="rp-field">
          <label for="password">비밀번호</label>
          <div class="rp-control">
            <span class="rp-icon" aria-hidden="true">🔒</span>
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              autocomplete="new-password"
              required
              @keyup="checkCaps"
            />
            <button type="button" class="rp-ghost" @click="showPassword = !showPassword">
              {{ showPassword ? '숨김' : '표시' }}
            </button>
          </div>
          <p v-if="capsOn" class="rp-assist rp-warn">Caps Lock이 켜져 있습니다</p>

          <div class="rp-strength">
            <div class="rp-bar" :style="{ width: strengthPercent + '%' }"></div>
          </div>
          <small class="rp-muted">8자 이상, 영문/숫자/기호 조합을 권장합니다.</small>
        </div>

        <!-- 비밀번호 확인 -->
        <div class="rp-field">
          <label for="confirm">비밀번호 확인</label>
          <div class="rp-control" :class="{ error: confirmTouched && !confirmValid }">
            <span class="rp-icon" aria-hidden="true">✅</span>
            <input
              id="confirm"
              :type="showPassword ? 'text' : 'password'"
              v-model="confirm"
              autocomplete="new-password"
              required
              @blur="confirmTouched = true"
            />
          </div>
          <p v-if="confirmTouched && !confirmValid" class="rp-assist rp-err">비밀번호가 일치하지 않습니다</p>
        </div>

        <!-- ✅ 항상 같은 스타일의 버튼(비활성 표시 X) -->
        <button
          class="rp-primary"
          :aria-disabled="loading || !canSubmit"
        >
          <span v-if="!loading">회원가입</span>
          <span v-else class="rp-spinner" aria-hidden="true"></span>
        </button>

        <p v-if="error" class="rp-alert">{{ error }}</p>
        <p v-if="success" class="rp-success">회원가입 성공! 로그인해 주세요.</p>

        <p class="rp-foot">
          이미 계정이 있으신가요?
          <router-link to="/login">로그인</router-link>
        </p>
      </form>
    </main>
  </div>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/register.css'

export default {
  name: 'Register',
  data() {
    return {
      username: '',
      password: '',
      confirm: '',
      showPassword: false,
      capsOn: false,
      confirmTouched: false,
      loading: false,
      error: '',
      success: false,
    }
  },
  computed: {
    strengthPercent() {
      let s = 0
      if (this.password.length >= 8) s += 25
      if (/[A-Z]/.test(this.password)) s += 25
      if (/[0-9]/.test(this.password)) s += 25
      if (/[^A-Za-z0-9]/.test(this.password)) s += 25
      return s
    },
    confirmValid() {
      return this.password && this.confirm && this.password === this.confirm
    },
    canSubmit() {
      return this.username && this.password && this.confirmValid
    }
  },
  methods: {
    checkCaps(e) {
      this.capsOn = e.getModifierState && e.getModifierState('CapsLock')
    },
    async onSubmit() {
      // ✅ 버튼은 항상 같은 스타일이지만, 유효하지 않으면 실제로는 제출 안 함
      if (!this.canSubmit || this.loading) return
      try {
        this.loading = true
        this.error = ''
        this.success = false
        await api.post('/auth/register', {
          username: this.username,
          password: this.password
        })
        this.success = true
        setTimeout(() => this.$router.replace('/login'), 800)
      } catch (err) {
        this.error = err?.response?.data?.message || '회원가입 실패'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
