<template>
  <div
    class="auth"
    :style="{ '--auth-bg': `url(${require('@/assets/auth.jpg')})` }"
  >
    <div class="auth-inner">
      <div class="art-pad" aria-hidden="true"></div>

      <section class="auth-panel">
        <img 
          src="@/assets/haeinlogo-main.png"
          alt="Hi-REMS 로고"
          class="auth-logo"
        />

        <header class="platform-head" aria-labelledby="heroMain">
          <h1 id="heroMain" class="hero-title">
            지속가능한 에너지 <br />모니터링 플랫폼
          </h1>
          <p class="hero-sub">
            새 비밀번호를 설정한 후 다시 로그인해 주세요.
          </p>
        </header>

        <main class="auth-card" role="main" aria-labelledby="resetTitle">
          <header class="cardc-hd">
            <h2 id="resetTitle">비밀번호 재설정</h2>
            <p class="sub" v-if="!tokenMissing">
              새 비밀번호를 입력해 주세요.
            </p>
            <p class="sub" v-else>
              유효한 링크가 만료되었거나 잘못되었습니다.<br />
              다시 요청해 주세요.
            </p>
          </header>

          <section v-if="tokenMissing" class="cardc-form">
            <button class="btn-teal" type="button" @click="$router.replace('/findpassword')">
              비밀번호 찾기 화면으로 이동
            </button>
          </section>

          <form v-else class="cardc-form" @submit.prevent="onSubmit" novalidate>
            <div class="field">
              <label for="password">새 비밀번호</label>
              <div class="pill" :class="{ error: passwordTouched && !passwordValid }">
                <input style="font-size:14px;"
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  autocomplete="new-password"
                  placeholder="영문/숫자/특수문자 조합 8자 이상"
                  required
                  @blur="passwordTouched = true"
                />
                <button type="button" class="pill-action"
                  @click="showPassword = !showPassword">
                  {{ showPassword ? '숨김' : '표시' }}
                </button>
              </div>

              <div class="pw-strength slim">
                <div class="bar" :style="{ width: strengthPercent + '%' }"></div>
              </div>

              <ul v-if="passwordTouched && passwordErrors.length" class="pw-errors compact">
                <li v-for="(err, i) in passwordErrors" :key="i">{{ err }}</li>
              </ul>
            </div>

            <div class="field">
              <label for="confirm">비밀번호 확인</label>
              <div class="pill" :class="{ error: confirmTouched && !confirmValid }">
                <input style="font-size:14px;"
                  id="confirm"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="confirm"
                  autocomplete="new-password"
                  placeholder="*******"
                  required
                  @blur="confirmTouched = true"
                />
              </div>
              <p v-if="confirmTouched && !confirmValid" class="pw-error-text">
                비밀번호가 일치하지 않습니다.
              </p>
            </div>

            <button class="btn-teal" :disabled="loading || !canSubmit" style="height:50px;">
              <span v-if="!loading">재설정 완료</span>
              <span v-else class="spinner" aria-hidden="true"></span>
            </button>

            <p v-if="error" class="pw-error-text mt8">{{ error }}</p>

<p v-if="done" class="reset-done-msg" aria-live="polite">
  <span class="done-main">비밀번호가 성공적으로 변경되었습니다.</span>
  <span class="done-sub">이제 로그인할 수 있어요.</span>
  <router-link to="/login" class="done-login-link">로그인 하러가기</router-link>
</p>
          </form>
        </main>
      </section>
    </div>
  </div>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/resetpassword.css'

export default {
  name: 'ResetPassword',
  data() {
    return {
      token: '',
      tokenMissing: false,

      password: '',
      confirm: '',
      showPassword: false,

      passwordTouched: false,
      confirmTouched: false,

      loading: false,
      error: '',
      done: false,
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

    passwordErrors() {
      const e = []
      const pw = this.password

      if (!pw || pw.length < 8) e.push('8자 이상 입력해 주세요.')
      if (!/[A-Z]/.test(pw)) e.push('대문자를 포함해야 합니다.')
      if (!/[a-z]/.test(pw)) e.push('소문자를 포함해야 합니다.')
      if (!/[0-9]/.test(pw)) e.push('숫자를 포함해야 합니다.')
      if (!/[^A-Za-z0-9]/.test(pw)) e.push('특수문자를 포함해야 합니다.')
      if (/\s/.test(pw)) e.push('공백 문자는 사용할 수 없습니다.')

      return e
    },

    passwordValid() {
      return this.passwordErrors.length === 0
    },
    confirmValid() {
      return this.password && this.password === this.confirm
    },
    canSubmit() {
      return this.passwordValid && this.confirmValid
    },
  },
  created() {
    const t = this.$route.query.token
    this.token = typeof t === 'string' ? t : ''
    this.tokenMissing = !this.token
  },
  methods: {
    async onSubmit() {
      if (this.loading || !this.canSubmit || this.tokenMissing) return

      this.error = ''
      this.done = false

      try {
        this.loading = true

        await api.post('/auth/reset', {
          token: this.token,
          new_password: this.password,
        })

        this.done = true
      } catch (err) {
        this.error =
          err?.response?.data?.message ||
          err.message ||
          '비밀번호 재설정에 실패했습니다.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
