<template>
  <header class="hdr-topbar">
    <div class="hdr-brand">
      <!-- 뒤로가기(메인으로) -->

      <span class="hdr-dot"></span>
      <span class="hdr-logo">Hi-REMS</span>
      <span class="hdr-badge">v1.0</span>
    </div>

    <div class="hdr-right">
<!-- 로고 왼쪽이나 오른쪽 원하는 위치에 배치 -->
<button
  class="hdr-chip hdr-back"
  type="button"
  :disabled="isHome"
  :aria-label="isHome ? '메인 화면' : '이전 화면으로 이동'"
  @click="goBack"
>
  <span class="hdr-ico" aria-hidden="true">
    <!-- 아이콘: 화살표(arrow-left) -->
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 12H5"/>
      <path d="M12 19l-7-7 7-7"/>
    </svg>
  </span>
</button>


      <!-- 테마 토글 -->
      <button
        class="hdr-chip hdr-mode-toggle"
        type="button"
        :aria-label="isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
        @click="toggleTheme"
      >
        <span class="hdr-ico" aria-hidden="true">
          <!-- 다크면 해(sun), 라이트면 달(moon) -->
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
import '@/assets/css/header.css'

export default {
  name: 'AppHeader',
  data () {
    return { isDark: false }
  },
  mounted () {
    const saved = localStorage.getItem('theme') // 'dark' | 'light' | null
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    const initial = saved || (prefersDark ? 'dark' : 'light')
    this.applyTheme(initial)
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
  // 개발용 경고 헬퍼(프로덕션에서도 문제 없음)
  devWarn (msg, err) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(msg, err)
    }
  },
  goBack () {
    // 홈이면 아무 것도 안 함
    if (this.isHome) return;

    // 라우터가 있으면 먼저 시도
    if (this.$router && typeof this.$router.back === 'function') {
      try {
        this.$router.back();
        return;
      } catch (e) {
        this.devWarn('[AppHeader] router.back 실패', e);
      }
    }

    // 브라우저 히스토리 시도
    if (window.history.length > 1) {
      window.history.go(-1);
      return;
    }

    // 마지막 폴백: 홈으로 이동
    if (this.$router) {
      try {
        this.$router.push({ name: 'home' })
          .catch(() => this.$router.push('/'));
        return;
      } catch (e) {
        this.devWarn('[AppHeader] router.push 폴백 실패', e);
      }
    }
    window.location.href = '/';
  }
}

}
</script>
