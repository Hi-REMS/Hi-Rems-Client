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

          <!-- 실시간 유효성 검사 메시지 -->
          <ul v-if="passwordErrors.length" class="pw-errors">
            <li v-for="(err, i) in passwordErrors" :key="i">{{ err }}</li>
          </ul>

          <p v-if="capsOn" class="rp-assist rp-warn">Caps Lock이 켜져 있습니다</p>

          <div class="rp-strength">
            <div class="rp-bar" :style="{ width: strengthPercent + '%' }"></div>
          </div>
          <small class="rp-muted">8자 이상, 대·소문자/숫자/특수문자를 포함해야 합니다.</small>
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
          <p v-if="confirmTouched && !confirmValid" class="pw-error-text">
            비밀번호가 일치하지 않습니다.
          </p>
        </div>

        <!-- 버튼 -->
        <button class="rp-primary" :aria-disabled="loading || !canSubmit">
          <span v-if="!loading">회원가입</span>
          <span v-else class="rp-spinner" aria-hidden="true"></span>
        </button>

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
      passwordErrors: []
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
    passwordValid() {
      return this.validatePassword(this.password, this.username).valid
    },
    canSubmit() {
      return (
        this.username &&
        this.password &&
        this.confirmValid &&
        this.passwordValid
      )
    }
  },
  methods: {
    checkCaps(e) {
      this.capsOn = e.getModifierState && e.getModifierState('CapsLock')
    },

    validatePassword(pw, username = '') {
      const errors = []
      if (!pw || pw.length < 8) errors.push('8자 이상이어야 합니다')
      if (!/[A-Z]/.test(pw)) errors.push('대문자(A-Z)를 최소 1자 포함해야 합니다')
      if (!/[a-z]/.test(pw)) errors.push('소문자(a-z)를 최소 1자 포함해야 합니다')
      if (!/[0-9]/.test(pw)) errors.push('숫자(0-9)를 최소 1자 포함해야 합니다')
      if (!/[^A-Za-z0-9]/.test(pw)) errors.push('특수문자를 최소 1자 포함해야 합니다')
      if (/\s/.test(pw)) errors.push('공백 문자는 사용할 수 없습니다')
      if (username && pw.toLowerCase().includes(username.toLowerCase())) {
        errors.push('비밀번호에 아이디를 포함할 수 없습니다')
      }
      return { valid: errors.length === 0, errors }
    },

    extractErrorMessage(err) {
      const res = err?.response?.data
      if (res) {
        if (typeof res === 'string') return res
        if (res.message) return String(res.message)
        if (res.error) return String(res.error)
      }
      if (err?.message) return err.message
      return '알 수 없는 오류가 발생했습니다.'
    },

    async onSubmit() {
      if (this.loading) return
      const { valid, errors } = this.validatePassword(this.password, this.username)
      this.passwordErrors = errors

      if (!valid) return
      if (!this.confirmValid) {
        this.confirmTouched = true
        return
      }

      try {
        this.loading = true
        await api.post('/auth/register', {
          username: this.username,
          password: this.password
        })
        alert('회원가입에 성공하셨습니다!')
        this.$router.replace('/login')
      } catch (err) {
        const msg = this.extractErrorMessage(err)
        alert(`회원가입 실패: ${msg}`)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>