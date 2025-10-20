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
        <span class="hdr-label hdr-label--back">뒤로가기</span>
      </button>

      <!-- 프로필 -->
      <div
        v-if="requiresAuthRoute"
        class="hdr-profile"
        @keydown.esc="closeMenu"
      >
        <button
          ref="profileButton"
          class="hdr-btn hdr-btn--pill hdr-profile-btn"
          @click="toggleMenu"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          aria-haspopup="menu"
          title="계정 메뉴"
        >
          <span class="hdr-avatar" :aria-label="displayName || 'user'">{{ initials }}</span>
          <span class="hdr-name" v-if="displayName">{{ displayName }}</span>
          <svg class="hdr-caret" :class="{ 'is-open': menuOpen }" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- 모바일 오버레이 -->
        <div v-if="menuOpen" class="hdr-overlay" @click="closeMenu" aria-hidden="true"></div>

        <!-- 드롭다운 / 바텀시트 -->
        <transition name="hdr-pop">
          <div
            v-if="menuOpen"
            class="hdr-menu"
            role="menu"
            @click.stop
            ref="menuRoot"
            tabindex="-1"
            @keydown="onMenuKeydown"
          >
            <!-- 유저 카드 -->
            <div class="menu-user">
              <div class="menu-user-left">
                <div class="menu-avatar">{{ initials }}</div>
              </div>
              <div class="menu-user-right">
                <div class="menu-name">{{ profileLabel }}</div>
                <div class="menu-email" :title="email || username">
                  {{ email || username }}
                </div>
                <div class="menu-chips">
                  <span class="chip" :class="{ 'chip-admin': isAdmin }">{{ isAdmin ? 'Admin' : 'Member' }}</span>
                </div>
              </div>
            </div>

            <div class="hdr-menu-sep"></div>

            <!-- 섹션: 계정 -->
            <div class="menu-section" aria-label="계정">
              <button
                ref="item0"
                role="menuitem"
                class="hdr-menu-item"
                @click="goAccount"
                @keydown="onItemKeydown"
              >
                <svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm7 9a7 7 0 0 0-14 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>계정 설정</span>
                <i class="mi-chevron" aria-hidden="true">›</i>
              </button>

              <button
                ref="item1"
                role="menuitem"
                class="hdr-menu-item"
                @click="goChangePassword"
                @keydown="onItemKeydown"
              >
                <svg viewBox="0 0 24 24"><path d="M6 11V7a6 6 0 1 1 12 0v4M6 11h12v9H6Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>비밀번호 변경</span>
                <i class="mi-chevron" aria-hidden="true">›</i>
              </button>
            </div>

            <div class="hdr-menu-sep"></div>

            <!-- 섹션: 세션 -->
            <div class="menu-section" aria-label="세션">
              <button
                ref="item2"
                role="menuitem"
                class="hdr-menu-item hdr-menu-danger"
                @click="logout"
                @keydown="onItemKeydown"
              >
                <svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M3 12h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>로그아웃</span>
                <i class="mi-chevron" aria-hidden="true">›</i>
              </button>
            </div>
          </div>
        </transition>
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
      username: '',
      email: '',
      isAdmin: false
    }
  },
  mounted () {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    const initial = saved || (prefersDark ? 'dark' : 'light')
    this.applyTheme(initial)

    this.fetchMe()
    window.addEventListener('click', this.onOutsideClick)
  },
  beforeDestroy () {
    window.removeEventListener('click', this.onOutsideClick)
    document.body.classList.remove('no-scroll')
  },
  watch: {
    menuOpen (v) {
      // 모바일일 때만 바디 스크롤 잠금
      const isMobile = window.matchMedia('(max-width: 520px)').matches
      if (isMobile) {
        document.body.classList.toggle('no-scroll', v)
      }
    }
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
    displayName () {
      return this.email || this.username
    },
    initials () {
      const id = String(this.email || this.username || '')
      const head = id.replace(/@.*$/, '').trim()
      return (head[0] || 'U').toUpperCase()
    },
    profileLabel () {
      const name = (this.email || this.username || 'User').split('@')[0]
      return name.length > 1 ? name : 'User'
    }
  },
  methods: {
    async fetchMe () {
      try {
        const { data } = await api.get('/auth/me')
        const u = data?.user || {}
        this.username = u.username || ''
        this.email = u.email || ''
        const flag = localStorage.getItem('isAdmin')
        this.isAdmin = (u.is_admin === true) || (flag === 'true')
      } catch (_) {
        this.username = ''
        this.email = ''
        this.isAdmin = false
      }
    },
    applyTheme (mode) {
      document.documentElement.setAttribute('data-theme', mode)
      localStorage.setItem('theme', mode)
      this.isDark = (mode === 'dark')
    },
    toggleTheme () { this.applyTheme(this.isDark ? 'light' : 'dark') },
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
      this.$nextTick(() => {
        if (this.menuOpen) {
          const first = this.$refs.item0
          const root = this.$refs.menuRoot
          if (root) root.focus({ preventScroll: true })
          if (first?.focus) first.focus()
        }
      })
    },
    closeMenu () {
      if (!this.menuOpen) return
      this.menuOpen = false
      this.$nextTick(() => this.$refs.profileButton?.focus?.())
    },
    onOutsideClick (e) {
      const header = document.querySelector('.hdr-topbar')
      if (header && header.contains(e.target)) return
      this.closeMenu()
    },
    onMenuKeydown (e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        this.closeMenu()
      }
    },
    onItemKeydown (e) {
      const items = [this.$refs.item0, this.$refs.item1, this.$refs.item2].filter(Boolean)
      const idx = items.findIndex(el => el === e.currentTarget)
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus() }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus() }
      else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus() }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus() }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget?.click() }
    },
    goAccount () {
      this.menuOpen = false
      if (this.$router?.resolve('/account')?.resolved?.href) {
        this.$router.push('/account')
      } else {
        alert('계정 설정 화면이 아직 연결되지 않았습니다.')
      }
    },
    goChangePassword () {
      this.menuOpen = false
      this.$router.push('/findpassword')
    },
    async logout () {
      this.menuOpen = false
      try { await api.post('/auth/logout') } catch (e) {}
      finally {
        if (this.$router) this.$router.replace('/login')
        else window.location.href = '/#/login'
      }
    }
  }
}
</script>
