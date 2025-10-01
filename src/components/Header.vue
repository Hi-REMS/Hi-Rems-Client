<template>
  <header class="hdr-topbar">
    <div class="hdr-brand">
      <span class="hdr-dot"></span>
      <span class="hdr-logo">Hi-REMS</span>
      <span class="hdr-badge">v1.0</span>
    </div>

    <div class="hdr-right">
      <!-- 뒤로가기: 로그인/회원가입 화면에서는 숨김 -->
      <button
        v-if="!isAuthPage"
        class="hdr-chip hdr-back"
        type="button"
        :disabled="isHome"
        :aria-label="isHome ? '메인 화면' : '이전 화면으로 이동'"
        @click="goBack"
      >
        <span class="hdr-ico" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
        </span>
      </button>

<!-- 로그아웃: 보호 라우트에서만 표시 -->
<button
  v-if="requiresAuthRoute"
  class="hdr-chip hdr-logout"
  type="button"
  aria-label="로그아웃"
  @click="logout"
>
로그아웃
</button>



      <!-- 테마 토글: 로그인 화면에서도 노출하고 싶으면 그대로 두고,
           숨기고 싶으면 v-if="!isAuthPage" 를 추가하세요 -->
      <button
        class="hdr-chip hdr-mode-toggle"
        type="button"
        :aria-label="isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
        @click="toggleTheme"
      >
        <span class="hdr-ico" aria-hidden="true">
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </span>
        <span class="hdr-txt">{{ isDark ? '라이트 모드' : '다크 모드' }}</span>
      </button>
    </div>
  </header>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/header.css'

export default {
  name: 'AppHeader',
  data () {
    return { isDark: false }
  },
  mounted () {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    const initial = saved || (prefersDark ? 'dark' : 'light')
    this.applyTheme(initial)
  },
  computed: {
    // 현재 라우트가 보호 라우트인지(meta.requiresAuth 사용)
    requiresAuthRoute () {
      return this.$route?.matched?.some(r => r.meta && r.meta.requiresAuth) || false
    },
    // 로그인/회원가입 화면 여부
    isAuthPage () {
      const p = this.$route?.path || ''
      return p === '/login' || p === '/register'
    },
    // 홈 화면 여부
    isHome () {
      return this.$route && (this.$route.path === '/home')
    }
  },
  methods: {
    applyTheme (mode) {
      document.documentElement.setAttribute('data-theme', mode)
      localStorage.setItem('theme', mode)
      this.isDark = (mode === 'dark')
    },
    toggleTheme () {
      this.applyTheme(this.isDark ? 'light' : 'dark')
    },
    devWarn (msg, err) {
      if (typeof console !== 'undefined' && console.warn) console.warn(msg, err)
    },
    goBack () {
      if (this.isHome) return
      if (this.$router && typeof this.$router.back === 'function') {
        try { this.$router.back(); return } catch (e) { this.devWarn('[AppHeader] router.back 실패', e) }
      }
      if (window.history.length > 1) { window.history.go(-1); return }
      if (this.$router) {
        try { this.$router.push({ name: 'home' }).catch(() => this.$router.push('/')); return }
        catch (e) { this.devWarn('[AppHeader] router.push 폴백 실패', e) }
      }
      window.location.href = '/'
    },
    async logout () {
      try { await api.post('/auth/logout') }
      catch (e) { this.devWarn('[AppHeader] logout 실패', e) }
      finally {
        if (this.$router) this.$router.replace('/login')
        else window.location.href = '/#/login'
      }
    }
  }
}
</script>
