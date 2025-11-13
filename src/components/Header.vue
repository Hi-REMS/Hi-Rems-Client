<template>
  <header class="hdr-topbar">
    <div class="hdr-brand">
      <img 
        src="@/assets/haeinlogo.png"
        alt="Hi-REMS 로고"
        class="brand-logo"
      />
      <span class="sub-name">Hi-REMS</span>
      <span class="sub-badge">v1.0</span>
    </div>

    <div class="hdr-actions">
      <!-- 뒤로가기 -->
      <button
        v-if="canGoBack"
        class="hdr-btn hdr-back"
        @click="goBack"
        title="뒤로가기"
      >
        <span class="hdr-ico">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </button>

      <!-- 관리자 메뉴 -->
      <button
        v-if="isAdmin"
        class="hdr-admin-btn"
        @click="goUserManage"
        title="사용자 관리"
      >
        <i class="hdr-admin-ico">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-4 5c-5 0-8 2.5-8 5v2h16v-2c0-2.5-3-5-8-5Z"
            />
          </svg>
        </i>
        <span class="hdr-admin-txt">사용자 관리</span>
      </button>

      <!-- 테마 버튼 -->
      <button
        class="hdr-btn hdr-theme"
        @click="toggleTheme"
        :aria-label="isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
        title="테마 전환"
      >
        <i class="hdr-ico">
          <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5" />
            <path
              d="M12 1v2M12 21v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M1 12h2M21 12h2"
            />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79z" />
          </svg>
        </i>
      </button>

      <!-- 프로필 메뉴 -->
      <div
        v-if="requiresAuthRoute"
        class="hdr-profile"
        @keydown.esc="closeMenu"
      >
        <button
          ref="profileButton"
          class="hdr-btn hdr-btn--pill hdr-profile-btn"
          @click="toggleMenu"
          :aria-expanded="menuOpen"
          aria-haspopup="menu"
          title="계정 메뉴"
        >
          <span class="hdr-avatar">{{ initials }}</span>
          <span class="hdr-name" v-if="displayName">{{ displayName }}</span>
          <svg
            class="hdr-caret"
            :class="{ 'is-open': menuOpen }"
            viewBox="0 0 24 24"
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" />
          </svg>
        </button>

        <!-- 오버레이 -->
        <div
          v-show="menuOpen"
          class="hdr-overlay"
          @click="closeMenu"
          aria-hidden="true"
        ></div>

        <!-- 드롭다운 메뉴 -->
        <transition name="hdr-pop">
          <div
            v-show="menuOpen"
            class="hdr-menu"
            role="menu"
            ref="menuRoot"
            tabindex="-1"
            @click.stop
          >
            <div class="menu-user">
              <div class="menu-user-left">
                <div class="menu-avatar">{{ initials }}</div>
              </div>
              <div class="menu-user-right">
                <div class="menu-name">{{ profileLabel }}</div>
                <div class="menu-email">{{ email || username }}</div>
                <div class="menu-chips">
                  <span class="chip" :class="{ 'chip-admin': isAdmin }">
                    {{ isAdmin ? 'Admin' : 'Member' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="hdr-menu-sep"></div>

            <div class="menu-section">
              <button class="hdr-menu-item" @click="goChangePassword">
                <svg viewBox="0 0 24 24">
                  <path d="M6 11V7a6 6 0 1 1 12 0v4M6 11h12v9H6Z"
                    fill="none" stroke="currentColor" stroke-width="2" />
                </svg>
                <span>비밀번호 변경</span>
                <i class="mi-chevron">›</i>
              </button>
            </div>

            <div class="hdr-menu-sep"></div>

            <div class="menu-section">
              <button class="hdr-menu-item hdr-menu-danger" @click="logout">
                <svg viewBox="0 0 24 24">
                  <path d="M10 17l5-5-5-5M3 12h12"
                    fill="none" stroke="currentColor" stroke-width="2" />
                </svg>
                <span>로그아웃</span>
                <i class="mi-chevron">›</i>
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

  data() {
    return {
      isDark: false,
      menuOpen: false,
      username: '',
      email: '',
      isAdmin: false,
      canGoBack: false,
      entryUrl: null
    }
  },

  mounted() {
    // 테마 설정
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    const initial = saved || (prefersDark ? 'dark' : 'light')
    this.applyTheme(initial)

    this.fetchMe()

    // 🔥 window → document, capture 모드 true (중요)
    document.addEventListener('click', this.onOutsideClick, true)

    // 뒤로가기 판단용 entry URL
    if (!sessionStorage.getItem('entryUrl')) {
      sessionStorage.setItem('entryUrl', window.location.href)
    }
    this.entryUrl = sessionStorage.getItem('entryUrl')
    this.updateCanGoBack()
  },

  beforeDestroy() {
    document.removeEventListener('click', this.onOutsideClick, true)
  },

  watch: {
    '$route'() {
      this.updateCanGoBack()
    }
  },

  computed: {
    requiresAuthRoute() {
      return this.$route?.matched?.some(r => r.meta?.requiresAuth) || false
    },
    displayName() {
      return this.email || this.username
    },
    initials() {
      const id = String(this.email || this.username || '')
      return (id.replace(/@.*$/, '').trim()[0] || 'U').toUpperCase()
    },
    profileLabel() {
      return (this.email || this.username || 'User').split('@')[0] || 'User'
    }
  },

  methods: {
    async fetchMe() {
      try {
        const { data } = await api.get('/auth/me')
        const u = data?.user || {}
        this.username = u.username || ''
        this.email = u.email || ''
        this.isAdmin = u.username === 'admin@company.com' || u.worker === '관리자'
      } catch {
        this.username = ''
        this.email = ''
        this.isAdmin = false
      }
    },

    applyTheme(mode) {
      document.documentElement.setAttribute('data-theme', mode)
      localStorage.setItem('theme', mode)
      this.isDark = (mode === 'dark')
    },

    toggleTheme() {
      this.applyTheme(this.isDark ? 'light' : 'dark')
    },

    goUserManage() {
      this.$router.push('/admin/members')
    },

    goChangePassword() {
      this.$router.push('/change-password')
    },

    logout() {
      api.post('/auth/logout').finally(() => {
        ['isAdmin','username','email','worker','phoneNumber'].forEach(k =>
          localStorage.removeItem(k)
        )
        sessionStorage.clear()
        this.$router.replace('/login')
      })
    },

    toggleMenu() {
      this.menuOpen = !this.menuOpen
    },

    closeMenu() {
      this.menuOpen = false
    },

    // 🔥 드롭다운 외부 클릭 감지 — 완전 안전한 버전
    onOutsideClick(e) {
      const btn = this.$refs.profileButton
      const menu = this.$refs.menuRoot

      if (btn && btn.contains(e.target)) return
      if (menu && menu.contains(e.target)) return

      this.closeMenu()
    },

    updateCanGoBack() {
      this.canGoBack = window.location.href !== this.entryUrl
    },

    goBack() {
      if (this.canGoBack) this.$router.back()
    }
  }
}
</script>
