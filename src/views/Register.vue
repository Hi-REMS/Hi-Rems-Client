<!-- src/views/Register.vue -->
<template>
  <div
    class="auth"
    :style="{ '--auth-bg': `url(${require('@/assets/auth.jpg')})` }"
  >
    <div class="auth-inner">
      <div class="art-pad" aria-hidden="true"></div>

      <section class="auth-panel">
        <header class="platform-head" aria-labelledby="heroMain">
          <h1 id="heroMain" class="hero-title">
            지속가능한 에너지<br />모니터링 플랫폼
          </h1>
          <p class="hero-sub">
            태양광·지열·태양열 설비의 발전량과 상태를 한 곳에서 관리하세요.
          </p>
        </header>

        <main class="auth-card" role="main" aria-labelledby="regTitle">
          <header class="cardc-hd">
            <h2 id="regTitle" style="color:#2d2d2d;">회원가입</h2>
            <p class="sub">새 계정을 만들어 대시보드를 이용해 보세요.</p>
          </header>

          <form class="cardc-form" @submit.prevent="onSubmit" novalidate>
            <!-- 아이디(이메일) -->
            <div class="field">
              <label for="username">아이디(이메일)</label>
              <div class="pill" :class="{ error: usernameTouched && !usernameValid }">
                <input
                  id="username"
                  v-model.trim="username"
                  type="email"
                  inputmode="email"
                  autocomplete="username"
                  placeholder="admin@company.com"
                  required
                  @blur="usernameTouched = true"
                  @keydown.space.prevent
                />
              </div>
              <ul v-if="usernameTouched && usernameErrors.length" class="pw-errors compact">
                <li v-for="(err, i) in usernameErrors" :key="i">{{ err }}</li>
              </ul>
            </div>

            <!-- 담당자(이름) -->
            <div class="field">
              <label for="worker">담당자(이름)</label>
              <div class="pill" :class="{ error: workerTouched && !workerValid }">
                <input
                  id="worker"
                  v-model.trim="worker"
                  type="text"
                  autocomplete="name"
                  placeholder="홍길동"
                  required
                  @blur="workerTouched = true"
                />
              </div>
              <p v-if="workerTouched && !workerValid" class="pw-error-text">
                담당자를 입력해 주세요. (2자 이상)
              </p>
            </div>

            <!-- 주소 -->
            <div class="field">
              <label for="address">주소</label>
              <div class="pill" :class="{ error: addressTouched && !addressValid }">
                <input
                  id="address"
                  v-model.trim="address"
                  type="text"
                  autocomplete="street-address"
                  placeholder="서울특별시 중구 세종대로 110"
                  required
                  @blur="addressTouched = true"
                />
              </div>
              <p v-if="addressTouched && !addressValid" class="pw-error-text">
                주소를 입력해 주세요. (5자 이상)
              </p>
            </div>

            <!-- 비밀번호 -->
            <div class="field">
              <label for="password">비밀번호</label>
              <div class="pill" :class="{ error: passwordTouched && !passwordValid }">
                <input
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  autocomplete="new-password"
                  placeholder="********"
                  required
                  @keyup="checkCaps"
                  @blur="passwordTouched = true"
                />
                <button type="button" class="pill-action" @click="showPassword = !showPassword">
                  {{ showPassword ? '숨김' : '표시' }}
                </button>
              </div>

              <div class="pw-strength slim" aria-hidden="true">
                <div class="bar" :style="{ width: strengthPercent + '%' }"></div>
              </div>
              <ul v-if="passwordTouched && passwordErrors.length" class="pw-errors compact">
                <li v-for="(err, i) in passwordErrors" :key="i">{{ err }}</li>
              </ul>
            </div>

            <!-- 비밀번호 확인 -->
            <div class="field">
              <label for="confirm">비밀번호 확인</label>
              <div class="pill" :class="{ error: confirmTouched && !confirmValid }">
                <input
                  id="confirm"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="confirm"
                  autocomplete="new-password"
                  placeholder="비밀번호 재입력"
                  required
                  @blur="confirmTouched = true"
                />
              </div>
              <p v-if="confirmTouched && !confirmValid" class="pw-error-text">
                비밀번호가 일치하지 않습니다.
              </p>
            </div>

            <!-- 제출 -->
            <button class="btn-teal" :disabled="loading || !canSubmit">
              <span v-if="!loading">회원가입</span>
              <span v-else class="spinner" aria-hidden="true"></span>
            </button>

            <p class="foot mt8">
              이미 계정이 있으신가요? <router-link to="/login">로그인</router-link>
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
  name: 'Register',
  data() {
    return {
      username: '',  usernameTouched: false,
      worker:   '',  workerTouched: false,   // ✅ 추가
      address:  '',  addressTouched: false,  // ✅ 추가
      password: '',  passwordTouched: false,
      confirm:  '',  confirmTouched: false,
      showPassword: false, capsOn: false, loading: false,
    }
  },
  computed: {
    // 이메일 검증
    usernameValid() {
      const v = this.username
      return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    },
    usernameErrors() {
      const e = []
      if (!this.username) e.push('이메일을 입력해 주세요.')
      else if (!this.usernameValid) e.push('올바른 이메일 형식이 아닙니다.')
      return e
    },

    // worker/address 간단 검증
    workerValid()  { return !!this.worker && this.worker.length >= 2 },
    addressValid() { return !!this.address && this.address.length >= 5 },

    // 비밀번호 강도
    strengthPercent() {
      let s = 0
      if (this.password.length >= 8) s += 25
      if (/[A-Z]/.test(this.password)) s += 25
      if (/[0-9]/.test(this.password)) s += 25
      if (/[^A-Za-z0-9]/.test(this.password)) s += 25
      return s
    },
    passwordErrors() {
      const e = []
      const pw = this.password
      if (!pw || pw.length < 8) e.push('8자 이상이어야 합니다.')
      if (!/[A-Z]/.test(pw)) e.push('대문자(A-Z)를 포함하세요.')
      if (!/[a-z]/.test(pw)) e.push('소문자(a-z)를 포함하세요.')
      if (!/[0-9]/.test(pw)) e.push('숫자(0-9)를 포함하세요.')
      if (!/[^A-Za-z0-9]/.test(pw)) e.push('특수문자를 포함하세요.')
      if (/\s/.test(pw)) e.push('공백 문자는 사용할 수 없습니다.')
      if (this.username && pw.toLowerCase().includes(this.username.toLowerCase()))
        e.push('비밀번호에 아이디(이메일)를 포함할 수 없습니다.')
      return e
    },
    passwordValid() { return this.passwordErrors.length === 0 },
    confirmValid()  { return !!this.password && this.password === this.confirm },

    // 제출 허용
    canSubmit() {
      return this.usernameValid && this.workerValid && this.addressValid && this.passwordValid && this.confirmValid
    }
  },
  methods: {
    checkCaps(e) { this.capsOn = e.getModifierState && e.getModifierState('CapsLock') },
    async onSubmit() {
      if (this.loading || !this.canSubmit) return
      try {
        this.loading = true
        await api.post('/auth/register', {
          username: this.username,
          password: this.password,
          worker:   this.worker,   // ✅ 전송
          address:  this.address   // ✅ 전송
        })
        alert('회원가입에 성공하셨습니다!')
        this.$router.replace('/login')
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || '등록 실패'
        alert(`회원가입 실패: ${msg}`)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
