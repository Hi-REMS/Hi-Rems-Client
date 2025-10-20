<template>
  <header class="hdr-topbar">
    <!-- 브랜드 -->
    <div class="hdr-brand">
      <span class="hdr-dot"></span>
      <span class="hdr-logo">Hi-REMS</span>
      <span class="hdr-badge">v1.0</span>
    </div>

    <!-- 우측 컨트롤 -->
    <div class="hdr-actions">
      <!-- 테마 토글 -->
      <button
        class="hdr-btn hdr-theme"
        :aria-label="isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
        @click="toggleTheme"
        title="테마 전환"
      >
        <i class="hdr-ico">
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M1 12h2M21 12h2" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79z" />
          </svg>
        </i>
      </button>

      <!-- 뒤로가기 -->
      <button
        v-if="!isAuthPage"
        class="hdr-btn hdr-back hdr-btn--pill"
        type="button"
        :disabled="isHome"
        @click="goBack"
        title="뒤로가기"
      >
        <span class="hdr-label">뒤로가기</span>
      </button>

      <!-- 프로필(회원정보/로그아웃) -->
      <div
        v-if="requiresAuthRoute"
        class="hdr-profile"
        @keydown.esc="menuOpen=false"
      >
        <button
          class="hdr-btn hdr-btn--pill hdr-profile-btn"
          @click="toggleMenu"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          aria-haspopup="menu"
          title="계정 메뉴"
        >
          <span class="hdr-avatar" :aria-label="username || 'user'">{{ initials }}</span>
          <span class="hdr-name" v-if="username">{{ username }}</span>
          <svg class="hdr-caret" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <ul
          v-if="menuOpen"
          class="hdr-menu"
          role="menu"
          @click.stop
        >
          <li role="none">
            <button role="menuitem" class="hdr-menu-item" @click="goAccount">
              <svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm7 9a7 7 0 0 0-14 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>계정 설정</span>
            </button>
          </li>
          <li role="none">
            <button role="menuitem" class="hdr-menu-item" @click="goChangePassword">
              <svg viewBox="0 0 24 24"><path d="M6 11V7a6 6 0 1 1 12 0v4M6 11h12v9H6Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>비밀번호 변경</span>
            </button>
          </li>
          <li role="none" class="hdr-menu-sep"></li>
          <li role="none">
            <button role="menuitem" class="hdr-menu-item hdr-menu-danger" @click="logout">
              <svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M3 12h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>로그아웃</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </header>
</template>

<script>
import { api } from '@/api'
import '@/assets/css/header.css'

export default {
  name: 'AppHeader',
  data () {
    return {
      isDark: false,
      menuOpen: false,
      username: ''
    }
  },
  mounted () {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    const initial = saved || (prefersDark ? 'dark' : 'light')
    this.applyTheme(initial)

    // 사용자명 불러와 아바타/라벨에 사용
    this.fetchMe()

    // 바깥 클릭 시 드롭다운 닫기
    window.addEventListener('click', this.onOutsideClick)
  },
  beforeDestroy () {
    window.removeEventListener('click', this.onOutsideClick)
  },
  computed: {
    requiresAuthRoute () {
      return this.$route?.matched?.some(r => r.meta && r.meta.requiresAuth) || false
    },
    isAuthPage () {
      const p = this.$route?.path || ''
      return p === '/login' || p === '/register'
    },
    isHome () {
      return this.$route && (this.$route.path === '/home')
    },
    initials () {
      if (!this.username) return 'U'
      const id = String(this.username)
      const head = id.replace(/@.*$/, '').trim()
      return (head[0] || 'U').toUpperCase()
    }
  },
  methods: {
    async fetchMe () {
      try {
        const { data } = await api.get('/auth/me')
        this.username = data?.user?.username || ''
      } catch (_) {
        this.username = ''
      }
    },
    applyTheme (mode) {
      document.documentElement.setAttribute('data-theme', mode)
      localStorage.setItem('theme', mode)
      this.isDark = (mode === 'dark')
    },
    toggleTheme () { this.applyTheme(this.isDark ? 'light' : 'dark') },
    devWarn (msg, err) { if (console?.warn) console.warn(msg, err) },
    goBack () {
      if (this.isHome) return
      if (this.$router?.back) { try { this.$router.back(); return } catch (e) {} }
      if (history.length > 1) { history.go(-1); return }
      if (this.$router) { try { this.$router.push({ name: 'home' }); return } catch (e) {} }
      window.location.href = '/'
    },
    toggleMenu (e) {
      e?.stopPropagation?.()
      this.menuOpen = !this.menuOpen
    },
    onOutsideClick (e) {
      // 헤더 내부 클릭이면 무시
      const header = document.querySelector('.hdr-topbar')
      if (header && header.contains(e.target)) return
      this.menuOpen = false
    },
    goAccount () {
      this.menuOpen = false
      // 실제 계정 설정 라우트가 있다면 아래를 해당 경로로 교체
      if (this.$router?.resolve('/account')?.resolved?.href) {
        this.$router.push('/account')
      } else {
        alert('계정 설정 화면이 아직 연결되지 않았습니다.')
      }
    },
    goChangePassword () {
      this.menuOpen = false
      this.$router.push('/findpassword') // 비밀번호 재설정 요청 화면으로
    },
    async logout () {
      this.menuOpen = false
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
