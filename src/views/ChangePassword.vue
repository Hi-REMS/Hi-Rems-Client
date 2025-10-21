<template>
  <div class="auth" :style="{ '--auth-bg': `url(${require('@/assets/auth.jpg')})` }">
    <div class="auth-inner">
      <div class="art-pad" aria-hidden="true"></div>

      <section class="auth-panel">
        <header class="platform-head" aria-labelledby="heroMain">
          <h1 id="heroMain" class="hero-title">비밀번호 변경</h1>
          <p class="hero-sub strong-text">
            계정 보안을 위해 주기적으로 비밀번호를 변경하세요.<br />
            비밀번호는 외부에 노출되지 않도록 주의해주세요.
          </p>
        </header>

        <main class="auth-card modern-card" role="main" aria-labelledby="changeTitle">
          <header class="cardc-hd">
            <h2 id="changeTitle" class="title-dark" style="color:black;">비밀번호 재설정</h2>
            <p class="sub">현재 비밀번호를 확인한 후 새 비밀번호를 설정하세요.</p>
          </header>

          <form class="cardc-form" @submit.prevent="onSubmit" novalidate>
            <!-- 현재 비밀번호 -->
            <div class="field">
              <label for="current">현재 비밀번호</label>
              <div class="pill" :class="{ error: curTouched && !curValid }">
                <input
                  id="current"
                  :type="showCurrent ? 'text' : 'password'"
                  v-model="current"
                  placeholder="현재 비밀번호 입력"
                  required
                  @blur="curTouched = true"
                />
                <button type="button" class="pill-action" @click="showCurrent = !showCurrent">
                  {{ showCurrent ? '숨김' : '표시' }}
                </button>
              </div>
              <p v-if="curTouched && !curValid" class="pw-error-text">현재 비밀번호를 입력하세요.</p>
            </div>

            <!-- 새 비밀번호 -->
            <div class="field">
              <label for="newPw">새 비밀번호</label>
              <div class="pill" :class="{ error: newTouched && !newValid }">
                <input
                  id="newPw"
                  :type="showNew ? 'text' : 'password'"
                  v-model="newPw"
                  placeholder="새 비밀번호 입력 (8자 이상)"
                  required
                  @blur="newTouched = true"
                />
                <button type="button" class="pill-action" @click="showNew = !showNew">
                  {{ showNew ? '숨김' : '표시' }}
                </button>
              </div>
              <ul v-if="newTouched && newErrors.length" class="pw-errors compact">
                <li v-for="(err, i) in newErrors" :key="i">{{ err }}</li>
              </ul>
            </div>

            <!-- 새 비밀번호 확인 -->
            <div class="field">
              <label for="confirmPw">새 비밀번호 확인</label>
              <div class="pill" :class="{ error: confTouched && !confValid }">
                <input
                  id="confirmPw"
                  :type="showNew ? 'text' : 'password'"
                  v-model="confirmPw"
                  placeholder="새 비밀번호 재입력"
                  required
                  @blur="confTouched = true"
                />
              </div>
              <p v-if="confTouched && !confValid" class="pw-error-text">비밀번호가 일치하지 않습니다.</p>
            </div>

            <!-- 제출 -->
            <button class="btn-teal modern-btn" :disabled="loading || !canSubmit">
              <span v-if="!loading">비밀번호 변경</span>
              <span v-else class="spinner" aria-hidden="true"></span>
            </button>

            <!-- 안내 문구 -->
            <p class="foot mt8 info-text strong-text">
              ⚠️ 비밀번호는 대문자, 숫자, 특수문자를 포함해야 합니다.<br />
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
import '@/assets/css/change-password.css'
export default {
  name: 'ChangePassword',
  data() {
    return {
      current: '', curTouched: false,
      newPw: '', newTouched: false,
      confirmPw: '', confTouched: false,
      showCurrent: false, showNew: false,
      loading: false
    }
  },
  computed: {
    curValid() { return !!this.current && this.current.length >= 4 },
    newErrors() {
      const pw = this.newPw
      const e = []
      if (pw.length < 8) e.push('8자 이상이어야 합니다.')
      if (!/[A-Z]/.test(pw)) e.push('대문자를 포함해야 합니다.')
      if (!/[a-z]/.test(pw)) e.push('소문자를 포함해야 합니다.')
      if (!/[0-9]/.test(pw)) e.push('숫자를 포함해야 합니다.')
      if (!/[^A-Za-z0-9]/.test(pw)) e.push('특수문자를 포함해야 합니다.')
      return e
    },
    newValid() { return this.newErrors.length === 0 },
    confValid() { return this.newPw && this.newPw === this.confirmPw },
    canSubmit() { return this.curValid && this.newValid && this.confValid }
  },
  methods: {
    async onSubmit() {
      if (!this.canSubmit) return
      this.loading = true
      try {
        await api.post('/auth/change-password', {
          current_password: this.current,
          new_password: this.newPw
        })
        alert('비밀번호가 성공적으로 변경되었습니다.')

        const back = this.$route.query?.back
        let defaultPath = '/analysis/timeseries'
        try {
          const { data } = await api.get('/auth/me')
          const u = data?.user || {}
          const ident = String(u.email || u.username || '').trim().toLowerCase()
          const isAdmin = ident === 'admin@company.com' || u.is_admin === true
          defaultPath = isAdmin ? '/home' : '/analysis/timeseries'
        } catch (_) {}
        if (back && back !== '/change-password') {
          this.$router.replace(back)
        } else {
          this.$router.replace(defaultPath)
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err.message || '비밀번호 변경 실패'
        alert(msg)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
