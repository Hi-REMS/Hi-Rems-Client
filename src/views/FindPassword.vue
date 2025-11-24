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
            태양광·지열·태양열 설비의 발전량과 상태를 한 곳에서 확인하세요.
          </p>
        </header>

        <main class="auth-card" role="main" aria-labelledby="forgotTitle">
          <header class="cardc-hd">
            <h2 id="forgotTitle" style="color:#2d2d2d;">비밀번호 찾기</h2>
            <p class="sub">
              가입하신 아이디(이메일)를 입력하면<br />
              비밀번호 재설정 링크를 보내드립니다.
            </p>
          </header>

          <form
            v-if="!sent"
            class="cardc-form"
            @submit.prevent="onSubmit"
            novalidate
          >
            <div class="field">
              <label for="username">아이디(이메일)</label>
              <div class="pill" :class="{ error: touched && !usernameValid }">
                <input style="font-size:14px;"
                  id="username"
                  v-model.trim="username"
                  type="email"
                  inputmode="email"
                  autocomplete="username"
                  placeholder="email@example.com"
                  required
                  @blur="touched = true"
                  @keydown.space.prevent
                />
              </div>
              <p v-if="touched && !usernameValid" class="pw-error-text">
                올바른 이메일 형식을 입력해 주세요.
              </p>
            </div>

            <button class="btn-teal" :disabled="loading || !usernameValid">
              <span v-if="!loading">재설정 링크 보내기</span>
              <span v-else class="spinner" aria-hidden="true"></span>
            </button>

           <p class="foot mt8">
           <router-link to="/login">로그인</router-link> 
           으로 돌아가기
           </p>

            <p v-if="error" class="pw-error-text" style="margin-top:8px;" aria-live="polite">
              {{ error }}
            </p>
          </form>

          <section v-else class="cardc-form" aria-live="polite">
            <div class="field">
              <p class="sub" style="line-height:1.6; color:black; font-size:">
                <strong>{{ maskedUsername }}</strong> 로
                비밀번호 재설정 링크를 보냈습니다.<br />
                10분 이내에 메일이 도착하지 않으면 스팸함을 확인하거나
                다시 시도해 주세요.
              </p>
            </div>

            <button class="btn-teal" type="button" @click="goToLogin">
              로그인으로 이동
            </button>

            <p class="foot mt8">
              이메일을 잘못 입력했나요?
              <button class="link" type="button" @click="resetForm">
                다시 입력
              </button>
            </p>
          </section>
        </main>
      </section>
    </div>
  </div>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/register.css'

export default {
  name: 'ForgotPassword',
  data() {
    return {
      username: '',
      touched: false,
      loading: false,
      error: '',
      sent: false,
    }
  },
  computed: {
    usernameValid() {
      const v = this.username
      return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    },
    maskedUsername() {
      const v = this.username || ''
      const [id, domain] = v.split('@')
      if (!id || !domain) return v
      const head = id.slice(0, 1)
      return `${head}${'*'.repeat(Math.max(1, id.length - 1))}@${domain}`
    },
  },
  methods: {
    resetForm() {
      this.username = ''
      this.touched = false
      this.loading = false
      this.error = ''
      this.sent = false
    },
    goToLogin() {
      this.$router.replace('/login')
    },

async onSubmit() {
  if (this.loading || !this.usernameValid) return
  this.error = ''; this.sent = false
  try {
    this.loading = true
    await api.post('/auth/forgot', {
      username: this.username.trim().toLowerCase()
    })
    this.sent = true
  } catch (err) {
    const status = err?.response?.status
    const msg = err?.response?.data?.message || err?.message || '요청 실패'

    if (status === 404) {
      this.error = '등록된 이메일이 없습니다.'
      this.sent = false
    } else {
      this.error = `전송에 실패했습니다: ${msg}`
    }
  } finally {
    this.loading = false
  }
},
  },
}
</script>
